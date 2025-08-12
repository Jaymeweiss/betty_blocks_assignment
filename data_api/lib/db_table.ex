defmodule DataApi.DbTable do
  use Ecto.Schema
  import Ecto.Changeset

  schema "db_tables" do
    field :name, :string

    timestamps()
  end

  def changeset(database, attrs) do
    database
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end