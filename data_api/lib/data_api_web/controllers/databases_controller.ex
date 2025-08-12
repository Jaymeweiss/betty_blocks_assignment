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
end
