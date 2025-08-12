defmodule DataApi.Repo.Migrations.CreateDatabasesTable do
  use Ecto.Migration

  def change do
    create table(:db_tables) do
      add :name, :string, null: false

      timestamps()
    end

    create unique_index(:db_tables, [:name])
  end
end
