defmodule DataCompiler.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      DataCompilerWeb.Telemetry,
      DataCompiler.Repo,
      {DNSCluster, query: Application.get_env(:data_compiler, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: DataCompiler.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: DataCompiler.Finch},
      # Start a worker by calling: DataCompiler.Worker.start_link(arg)
      # {DataCompiler.Worker, arg},
      # Start to serve requests, typically the last entry
      DataCompilerWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: DataCompiler.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    DataCompilerWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
