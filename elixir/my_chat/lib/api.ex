defmodule API do
  require Logger

  def add_user(pid) do
    case :ets.insert(:users, {pid}) do
      true ->
        Logger.info("user inserted")
      _ ->
        Logger.info("sumn wrong wit inserting users")
    end
  end

  def remove_user(pid) do
    case :ets.delete_object(:users, {pid}) do
      true ->
        Logger.info("user deleted")
      _ ->
        Logger.info("sumn wrong wit removing user")
    end
  end

  def broadcast(message) do
    {:ok, users} = get_users()
    for {user} <- users, do: GenServer.cast(user, {:publish, message})
  end

  defp get_users() do
    users = :ets.tab2list(:users)
    {:ok, users}
  end
end
