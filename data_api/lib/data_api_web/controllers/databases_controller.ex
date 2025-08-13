defmodule DataApiWeb.DatabasesController do
  use DataApiWeb, :controller
  import Ecto.Query
  alias DataApi.DbTable

  def db_tables(conn, _params) do
    tables = DataApi.Repo.all(
      from t in DbTable,
      select: t.name
    )

    json(conn, %{database_tables: tables})
  end

  def create_table(conn, %{"key" => key} = _params) do
    case fetch_config_from_redis(key) do
      {:ok, config} ->
        case create_table_from_config(config) do
          :ok ->
            conn
            |> put_status(201)
            |> json(%{
              status: "success",
              message: "Table '#{config.name}' created successfully"
            })

          {:error, {:table_creation, reason}} ->
            conn
            |> put_status(500)
            |> json(%{
              status: "error",
              message: "Failed to create table: #{inspect(reason)}"
            })

          {:error, reason} ->
            conn
            |> put_status(500)
            |> json(%{
              status: "error",
              message: "Failed for reason: #{inspect(reason)}"
            })
        end

      {:error, :not_found} ->
        conn
        |> put_status(404)
        |> json(%{
          status: "error",
          message: "Configuration not found for key: #{key}"
        })

      {:error, reason} ->
        conn
        |> put_status(500)
        |> json(%{
          status: "error",
          message: "Failed to retrieve configuration for the following reason: #{inspect(reason)}"
        })
    end
  end

  def create_table(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{
      status: "error",
      message: "Missing required parameter: key"
    })
  end

  defp fetch_config_from_redis(key) do
    case Redix.start_link(Application.get_env(:data_api, :redis, [])) do
      {:ok, redis_conn} ->
        try do
          case Redix.command(redis_conn, ["GET", key]) do
            {:ok, nil} ->
              {:error, :not_found}

            {:ok, json_string} ->
              case Jason.decode(json_string, keys: :atoms) do
                {:ok, config} -> {:ok, config}
                {:error, reason} -> {:error, {:json_decode, reason}}
              end

            {:error, reason} ->
              {:error, {:redis, reason}}
          end
        after
          Redix.stop(redis_conn)
        end

      {:error, reason} ->
        {:error, {:connection, reason}}
    end
  end

  defp create_table_from_config(config) do
    sql = build_create_table_sql(config)

    case Ecto.Adapters.SQL.query(DataApi.Repo, sql) do
      {:ok, _result} -> 
        case insert_db_table_record(config.name) do
          {:ok, _db_table} -> :ok
          {:error, _changeset} -> {:error, "Failed to insert into db_tables"}
        end
      {:error, error} -> {:error, {:table_creation, error}}
    end
  end

  defp insert_db_table_record(table_name) do
    %DbTable{}
    |> DbTable.changeset(%{name: table_name})
    |> DataApi.Repo.insert()
  end

  defp build_create_table_sql(config) do
    table_name = config.name

    columns_sql = config.columns
                  |> Enum.map(&build_column_sql/1)
                  |> Enum.join(", ")

    timestamps_sql = "created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()"

    "CREATE TABLE #{table_name} (id SERIAL PRIMARY KEY, #{columns_sql}, #{timestamps_sql})"
  end

  defp build_column_sql(%{name: name, type: type, size: size, default: default, nullable: nullable}) do
    sql_type = map_to_sql_type(type, size)

    column_sql = "#{name} #{sql_type}"

    column_sql = if nullable == false, do: "#{column_sql} NOT NULL", else: column_sql
    column_sql = if default, do: "#{column_sql} DEFAULT '#{default}'", else: column_sql

    column_sql
  end

  defp map_to_sql_type("string", size) when is_integer(size), do: "VARCHAR(#{size})"
  defp map_to_sql_type("string", _), do: "TEXT"
  defp map_to_sql_type("float", _), do: "REAL"
  defp map_to_sql_type("datetime", _), do: "TIMESTAMP"
  defp map_to_sql_type(type, _), do: String.upcase(type)

end
