ExUnit.start()

# Ensure the repo is started for testing
{:ok, _} = Application.ensure_all_started(:data_api)

Ecto.Adapters.SQL.Sandbox.mode(DataApi.Repo, :manual)
