defmodule MyChat do
  use Application

  def start(_type, _args) do
    :ets.new(:users, [:set, :named_table, :public])
    children = [
      {DynamicSupervisor, name: ClientSupervisor},
      {TCPClient, 4040}
    ]
    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
