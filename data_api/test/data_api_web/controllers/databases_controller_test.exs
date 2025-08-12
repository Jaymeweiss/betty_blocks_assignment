defmodule DataApiWeb.DatabasesControllerTest do
  use DataApiWeb.ConnCase
  alias DataApi.{Repo, DbTable}

  setup do
    {:ok, table} = Repo.insert(%DbTable{name: "test_table"})
    {:ok, table2} = Repo.insert(%DbTable{name: "another_table"})

    on_exit(fn ->
      Repo.delete_all(DbTable)
    end)

    %{tables: [table, table2]}
  end

  describe "db_tables/2" do
    test "returns list of database tables", %{conn: conn} do
      conn = get(conn, ~p"/db_tables")

      assert %{
               "database_tables" => ["test_table", "another_table"]
             } = json_response(conn, 200)
    end

    test "returns empty list when no tables exist", %{conn: conn} do
      Repo.delete_all(DbTable)

      conn = get(conn, ~p"/db_tables")

      assert %{
               "database_tables" => []
             } = json_response(conn, 200)
    end
  end

  defp redis_connection do
    redis_config = Application.get_env(:data_api, :redis, [])
    Redix.start_link(redis_config)
  end

  describe "create_table/2" do
    test "successfully creates a table from configuration placed in Redis", %{conn: conn} do
      config_key = "users_table_key"
      config = %{
        name: "users",
        columns: [
          %{name: "email", type: "string", size: 255, default: nil, nullable: false},
          %{name: "age", type: "integer", size: nil, default: 18, nullable: true},
          %{name: "is_active", type: "boolean", size: nil, default: true, nullable: false}
        ]
      }
      
      {:ok, redis_conn} = redis_connection()
      Redix.command!(redis_conn, ["SET", config_key, Jason.encode!(config)])
      
      drop_table_if_exists("users")
      
      conn = post(conn, ~p"/create_table", %{key: config_key})
      
      assert %{
               "status" => "success",
               "message" => "Table 'users' created successfully"
             } = json_response(conn, 201)
      
      assert table_exists?("users")
      
      drop_table_if_exists("users")
      Redix.command!(redis_conn, ["DEL", config_key])
      Redix.stop(redis_conn)
    end

    test "returns an error the when the 'key' parameter is missing", %{conn: conn} do
      conn = post(conn, ~p"/create_table", %{})

      assert %{
               "status" => "error",
               "message" => "Missing required parameter: key"
             } = json_response(conn, 400)
    end

    test "returns an error when the configuration is not found in Redis", %{conn: conn} do
      conn = post(conn, ~p"/create_table", %{key: "non_existent_key"})

      assert %{
               "status" => "error",
               "message" => "Configuration not found for key: non_existent_key"
             } = json_response(conn, 404)
    end

    test "returns an error when the configuration in Redis is invalid", %{conn: conn} do
      {:ok, redis_conn} = redis_connection()
      Redix.command!(redis_conn, ["SET", "invalid_json_key", "invalid json"])
      
      conn = post(conn, ~p"/create_table", %{key: "invalid_json_key"})
      
      assert %{
               "status" => "error",
               "message" => message
             } = json_response(conn, 500)
      
      assert String.contains?(message, "Failed to retrieve configuration")
      
      Redix.command!(redis_conn, ["DEL", "invalid_json_key"])
      Redix.stop(redis_conn)
    end

    test "returns an error when it is not possible to create the table", %{conn: conn} do
      config = %{
        name: "db_tables",
        columns: [
          %{name: "id", type: "integer", size: nil, default: nil, nullable: false}
        ]
      }
      
      {:ok, redis_conn} = redis_connection()
      Redix.command!(redis_conn, ["SET", "duplicate_table_key", Jason.encode!(config)])
      
      conn = post(conn, ~p"/create_table", %{key: "duplicate_table_key"})
      
      assert %{
               "status" => "error",
               "message" => message
             } = json_response(conn, 500)
      
      assert String.contains?(message, "Failed to create table")
      
      Redix.command!(redis_conn, ["DEL", "duplicate_table_key"])
      Redix.stop(redis_conn)
    end

    test "successfully creates table with various column types and options", %{conn: conn} do
      config = %{
        name: "complex_table",
        columns: [
          %{name: "name", type: "string", size: 100, default: "Custom Default Name", nullable: true},
          %{name: "description", type: "string", size: nil, default: "Custom Default Description", nullable: true},
          %{name: "price", type: "decimal", size: nil, default: nil, nullable: false},
          %{name: "custom_date", type: "date", size: nil, default: nil, nullable: true},
          %{name: "age", type: "integer", size: nil, default: nil, nullable: true},
          %{name: "accuracy", type: "float", size: nil, default: nil, nullable: true},
          %{name: "delivery_time", type: "datetime", size: nil, default: nil, nullable: true}
        ]
      }
      
      {:ok, redis_conn} = redis_connection()
      Redix.command!(redis_conn, ["SET", "complex_table_key", Jason.encode!(config)])
      
      drop_table_if_exists("complex_table")
      
      conn = post(conn, ~p"/create_table", %{key: "complex_table_key"})
      
      assert %{
               "status" => "success",
               "message" => "Table 'complex_table' created successfully"
             } = json_response(conn, 201)
      
      assert table_exists?("complex_table")

      drop_table_if_exists("complex_table")
      Redix.command!(redis_conn, ["DEL", "complex_table_key"])
      Redix.stop(redis_conn)
    end
  end

  defp table_exists?(table_name) do
    query = """
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
    """
    
    case Ecto.Adapters.SQL.query(Repo, query, [table_name]) do
      {:ok, %{rows: [[true]]}} -> true
      _ -> false
    end
  end

  defp drop_table_if_exists(table_name) do
    query = "DROP TABLE IF EXISTS #{table_name};"
    
    try do
      Ecto.Adapters.SQL.query!(Repo, query, [])
    rescue
      _ -> :ok
    end
  end
end