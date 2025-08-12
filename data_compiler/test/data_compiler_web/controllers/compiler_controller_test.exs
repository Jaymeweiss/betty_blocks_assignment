defmodule DataCompilerWeb.CompilerControllerTest do
  use DataCompilerWeb.ConnCase
  import ExUnit.CaptureLog

  setup do
    {:ok, redis_conn} = Redix.start_link(Application.get_env(:data_compiler, :redis, []))
    Redix.command!(redis_conn, ["FLUSHDB"])
    Redix.stop(redis_conn)
    :ok
  end

  describe "compile_json/2" do
    test "returns an error when the json_data parameter is not provided", %{conn: conn} do
      conn = post(conn, ~p"/compile", %{})

      assert %{
               "status" => "error",
               "message" => "Invalid JSON data provided"
             } = json_response(conn, 400)
    end

    test "returns an error if the json_data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/compile", %{json_data: "not_a_map"})

      assert %{
               "status" => "error",
               "message" => "Invalid JSON data provided"
             } = json_response(conn, 400)
    end

    test "processes valid json_data and stores it in Redis", %{conn: conn} do
      json_data = %{
        "name" => "test_table",
        "columns" => [
          %{"name" => "age", "type" => "integer", "size" => nil, "default" => nil, "nullable" => false},
          %{"name" => "email", "type" => "string", "size" => 255, "default" => nil, "nullable" => false},
          %{"name" => "is_active", "type" => "bool", "size" => nil, "default" => true, "nullable" => true}
        ]
      }

      original_url = setup_mock_api_failure()

      # Ensure we actually do call the Data API
      capture_log(fn ->
        conn = post(conn, ~p"/compile", %{json_data: json_data})
        
        assert %{
                 "status" => "error",
                 "message" => message
               } = json_response(conn, 500)
        
        assert String.contains?(message, "Failed to communicate with Data API")
      end)

      restore_api_url(original_url)

      parsed_data = get_redis_data("test_table")
      assert parsed_data != nil
      
      assert parsed_data.name == "test_table"

      [age_column, email_column, is_active_column] = parsed_data.columns
      assert age_column.type == "integer"
      assert email_column.type == "string"
      assert is_active_column.type == "boolean"
    end

    test "successfully maps our accepted column types to those which can be interpreted by the data API", %{conn: conn} do
      json_data = %{
        "name" => "type_test_table",
        "columns" => [
          %{"name" => "text_column", "type" => "text", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "int_column", "type" => "int", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "number_column", "type" => "number", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "decimal_column", "type" => "decimal", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "date_column", "type" => "date", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "time_column", "type" => "time", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "datetime_column", "type" => "date-time", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "datetime2_column", "type" => "date_time", "size" => nil, "default" => nil, "nullable" => true},
          %{"name" => "duration_column", "type" => "duration", "size" => nil, "default" => nil, "nullable" => true}
        ]
      }

      original_url = setup_mock_api_failure()

      capture_log(fn ->
        post(conn, ~p"/compile", %{json_data: json_data})
      end)

      restore_api_url(original_url)

      parsed_data = get_redis_data("type_test_table")

      assert parsed_data.name == "type_test_table"

      [text_column, int_column, number_column, decimal_column, date_column, time_column, datetime_column, datetime2_column, duration_column] = parsed_data.columns

      assert text_column.type == "string"
      assert int_column.type == "integer"
      assert number_column.type == "float"
      assert decimal_column.type == "decimal"
      assert date_column.type == "date"
      assert time_column.type == "time"
      assert datetime_column.type == "datetime"
      assert datetime2_column.type == "datetime"
      assert duration_column.type == "duration"
    end

    test "preserves column properties correctly", %{conn: conn} do
      json_data = %{
        "name" => "properties_test_table",
        "columns" => [
          %{"name" => "column_with_size", "type" => "string", "size" => 100, "default" => "default_value", "nullable" => false},
          %{"name" => "column_without_size", "type" => "text", "size" => nil, "default" => nil, "nullable" => true}
        ]
      }

      original_url = setup_mock_api_failure()

      capture_log(fn ->
        post(conn, ~p"/compile", %{json_data: json_data})
      end)

      restore_api_url(original_url)

      parsed_data = get_redis_data("properties_test_table")
      [column1, column2] = parsed_data.columns

      assert column1.name == "column_with_size"
      assert column1.size == 100
      assert column1.default == "default_value"
      assert column1.nullable == false

      assert column2.name == "column_without_size"
      assert column2.size == nil
      assert column2.default == nil
      assert column2.nullable == true
    end
  end

  defp setup_mock_api_failure do
    original_url = Application.get_env(:data_compiler, :data_api_url)
    Application.put_env(:data_compiler, :data_api_url, "http://localhost:9999")
    original_url
  end

  defp restore_api_url(original_url) do
    if original_url do
      Application.put_env(:data_compiler, :data_api_url, original_url)
    else
      Application.delete_env(:data_compiler, :data_api_url)
    end
  end

  defp get_redis_data(key) do
    {:ok, redis_conn} = Redix.start_link(Application.get_env(:data_compiler, :redis, []))
    stored_data = Redix.command!(redis_conn, ["GET", key])
    Redix.stop(redis_conn)
    if stored_data, do: Jason.decode!(stored_data, keys: :atoms), else: nil
  end


end