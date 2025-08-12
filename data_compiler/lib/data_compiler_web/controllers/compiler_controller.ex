defmodule DataCompilerWeb.CompilerController do
  use DataCompilerWeb, :controller

  def compile_json(conn, %{"json_data" => json_data} = _params) when is_map(json_data) do
    table_name = json_data["name"]

    data_structure = %{
      name: json_data["name"],
      columns: for column <- json_data["columns"] do
                                                  %{
                                                    name: column["name"],
                                                    type: map_ecto_type(column["type"]),
                                                    size: column["size"],
                                                    default: column["default"],
                                                    nullable: column["nullable"]
                                                  }
      end
    }

    {:ok, redis_conn} = Redix.start_link(Application.get_env(:data_compiler, :redis, []))
    Redix.command!(redis_conn, ["SET", table_name, Jason.encode!(data_structure)])
    Redix.stop(redis_conn)

    data_api_url = Application.get_env(:data_compiler, :data_api_url, "http://data_api:4000")
    headers = [{"content-type", "application/json"}]
    request_body = Jason.encode!(%{key: table_name})

    case Finch.build(:post, "#{data_api_url}/create_table", headers, request_body)
         |> Finch.request(DataCompiler.Finch) do
      {:ok, %Finch.Response{status: 201, body: response_body}} ->
        case Jason.decode(response_body) do
          {:ok, %{"status" => "success", "message" => message}} ->
            conn
            |> put_status(200)
            |> json(%{
              status: "success",
              message: message
            })
          
          _ ->
            conn
            |> put_status(200)
            |> json(%{
              status: "success",
              message: "Table created successfully"
            })
        end
      
      {:ok, %Finch.Response{status: status, body: response_body}} when status >= 400 ->
        case Jason.decode(response_body) do
          {:ok, %{"message" => message}} ->
            conn
            |> put_status(500)
            |> json(%{
              status: "error",
              message: "Data API error: #{message}"
            })
          
          _ ->
            conn
            |> put_status(500)
            |> json(%{
              status: "error",
              message: "Data API returned error (status: #{status})"
            })
        end
      
      {:error, reason} ->
        conn
        |> put_status(500)
        |> json(%{
          status: "error",
          message: "Failed to communicate with Data API: #{inspect(reason)}"
        })
    end
  end

  def compile_json(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{status: "error", message: "Invalid JSON data provided"})
  end

  defp map_ecto_type("string"), do: "string"
  defp map_ecto_type("text"), do: "string"
  defp map_ecto_type("boolean"), do: "boolean"
  defp map_ecto_type("bool"), do: "boolean"
  defp map_ecto_type("int"), do: "integer"
  defp map_ecto_type("integer"), do: "integer"
  defp map_ecto_type("number"), do: "float"
  defp map_ecto_type("decimal"), do: "decimal"
  defp map_ecto_type("date"), do: "date"
  defp map_ecto_type("time"), do: "time"
  defp map_ecto_type("date-time"), do: "datetime"
  defp map_ecto_type("date_time"), do: "datetime"
  defp map_ecto_type("duration"), do: "duration"

end
