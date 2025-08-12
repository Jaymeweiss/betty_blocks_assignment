FROM elixir:1.18.4-slim AS dev

WORKDIR /app

ARG UID=1000
ARG GID=1000

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates build-essential curl inotify-tools git \
    && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
    && apt-get clean \
    && groupadd -g "${GID}" elixir \
    && useradd --create-home --no-log-init -u "${UID}" -g "${GID}" elixir \
    && mkdir -p /mix && chown elixir:elixir -R /mix /app

USER elixir

RUN mix local.hex --force && mix local.rebar --force

ARG MIX_ENV="prod"
ENV MIX_ENV="${MIX_ENV}" \
    USER="elixir"

COPY --chown=elixir:elixir mix.* ./
RUN if [ "${MIX_ENV}" = "dev" ]; then \
    mix deps.get; else mix deps.get --only "${MIX_ENV}"; fi

COPY --chown=elixir:elixir config/config.exs config/"${MIX_ENV}".exs config/
RUN mix deps.compile

COPY --chown=elixir:elixir . .

RUN if [ "${MIX_ENV}" != "dev" ]; then \
    ln -s /public /app/priv/static \
    && mix phx.digest && mix release && rm -rf /app/priv/static; fi

COPY --chown=elixir:elixir entrypoint.sh /entrypoint.sh
USER root
RUN chmod +x /entrypoint.sh
USER elixir

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["mix", "phx.server"]
