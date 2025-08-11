defmodule DataCompilerWeb.CompilerController do
  use DataCompilerWeb, :controller

  def compile_json(conn, %{"json_data" => json_data} = _params) when is_map(json_data) do
    conn
    |> put_status(200)
    |> json(%{
      status: "success",
      message: "JSON data processed successfully",
      data: json_data
    })
  end

  def compile_json(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{status: "error", message: "Invalid JSON data provided"})
  end


end
