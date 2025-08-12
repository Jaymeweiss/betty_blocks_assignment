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
end