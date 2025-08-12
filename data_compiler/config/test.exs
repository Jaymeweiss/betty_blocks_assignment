import Config

# Redis
config :data_compiler, :redis,
  host: System.get_env("REDIS_HOST", "redis"),
  port: String.to_integer(System.get_env("REDIS_PORT", "6379")),
  timeout: 5000,
  sync_connect: true

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :data_compiler, DataCompilerWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "qGe8fRnTFWKx8+kGLw+UaSNxFNrXmOTYhPKreJx+csi5yn3rBZcwYmRvsWoFOlhN",
  server: false

# In test we don't send emails
config :data_compiler, DataCompiler.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Enable helpful, but potentially expensive runtime checks
config :phoenix_live_view,
  enable_expensive_runtime_checks: true
