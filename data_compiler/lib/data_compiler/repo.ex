defmodule DataCompiler.Repo do
  use Ecto.Repo,
    otp_app: :data_compiler,
    adapter: Ecto.Adapters.Postgres
end
