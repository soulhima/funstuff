defmodule ClientHandler do
  use GenServer, restart: :temporary
  require Logger

  def start_link(socket) do
    GenServer.start_link(__MODULE__, socket)
  end

  def init(socket) do
    Process.flag(:trap_exit, true)
    parent = self()
    Logger.info("I am Parent #{inspect(parent)}")
    {:ok, task_pid} = Task.start_link(fn -> serve(socket, parent) end)
    Logger.info("I am task #{inspect(task_pid)}")
    {:ok, socket}
  end

  def serve(socket, parent) do
    case read_line(socket) do
      {:ok, inbound} ->
        API.broadcast(inbound)
        serve(socket, parent)
      {:error, reason} ->
        Logger.info("error in the socket")
        exit({:socket_error, reason})
      _ ->
        Logger.info("some other case happened")
        exit(:unknown)
    end
  end

  defp read_line(socket) do
    :gen_tcp.recv(socket, 0)
  end

  def handle_cast({:publish, message}, socket) do
    Logger.info("Received message to publish: #{message}")
    case :gen_tcp.send(socket, message) do
      :ok ->
        {:noreply, socket}
      {:error, reason} ->
        Logger.info("error publishing message: #{reason}")
        {:noreply, socket}
    end
  end

  def handle_info({:EXIT, _task_pid, reason}, socket) do
    Logger.info("received exit message: #{inspect(reason)}")
    {:stop, :normal, socket}
  end
end
