defmodule MyChatTest do
  use ExUnit.Case
  doctest MyChat

  test "greets the world" do
    assert MyChat.hello() == :world
  end
end
