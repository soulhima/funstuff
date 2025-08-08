defmodule TCPClient do
  use Task
  require Logger

  def start_link(port) do
    Task.start_link(__MODULE__, :listen, [port])
  end

  def listen(port) do
    {:ok, socket} = :gen_tcp.listen(port, [:binary, packet: :line, active: false, reuseaddr: true])
    Logger.info("Task received socket")
    accept(socket)
  end

  def accept(socket) do
    {:ok, client} = :gen_tcp.accept(socket)
    Logger.info("New Client Connected")
    {:ok, handler} = DynamicSupervisor.start_child(ClientSupervisor, {ClientHandler, client})
    :ok = :gen_tcp.controlling_process(client, handler)
    Logger.info("Client Handler Initialized")
    Task.start(fn -> deregister(handler) end)
    API.add_user(handler)
    accept(socket)
  end

  def deregister(process) do
    _ = Process.monitor(process)
    receive do
      {:DOWN, _ref, :process, pid, reason} ->
        Logger.info("received down message with reason: #{inspect(reason)}")
        API.remove_user(pid)
    end
  end

end
