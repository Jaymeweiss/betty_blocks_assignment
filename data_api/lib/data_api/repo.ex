defmodule DataApi.Repo do
  use Ecto.Repo,
    otp_app: :data_api,
    adapter: Ecto.Adapters.Postgres
end
