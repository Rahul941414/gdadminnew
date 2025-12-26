"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GamePricesPage = () => {
  const router = useRouter();
  const [gamePrices, setGamePrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingGameId, setUpdatingGameId] = useState(null);

  useEffect(() => {
    fetchGamePrices();
  }, []);

  const fetchGamePrices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://backend.gdmatka.site/api/gameprices", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch game prices");
      }

      const data = await response.json();
      setGamePrices(data);
      alert("Game prices loaded successfully");
    } catch (error) {
      console.error(error);
      alert("Error fetching game prices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (id, event) => {
    const updatedPrices = gamePrices.map((game) =>
      game.id === id ? { ...game, game_amount: parseFloat(event.target.value) || 0 } : game
    );
    setGamePrices(updatedPrices);
  };

  const handleUpdate = async (id) => {
    const gameToUpdate = gamePrices.find((game) => game.id === id);

    if (!gameToUpdate) return;

    if (isNaN(gameToUpdate.game_amount) || gameToUpdate.game_amount <= 0) {
      alert("Please enter a valid game amount.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Authentication token is missing.");
      return;
    }

    setUpdatingGameId(id);

    try {
      const response = await fetch(`https://backend.gdmatka.site/api/gameprices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_name: gameToUpdate.game_name,
          market_type: gameToUpdate.market_type,
          game_amount: gameToUpdate.game_amount
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setGamePrices((prevPrices) =>
          prevPrices.map((game) =>
            game.id === id ? { ...game, game_amount: updatedData.game_amount } : game
          )
        );
        alert("Game amount updated successfully!");
      } else {
        alert("Failed to update the game amount.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating the game amount. Please try again.");
    } finally {
      setUpdatingGameId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl font-bold">Game Rates</CardTitle>
          </div>
          <Button
            variant="outline"
            onClick={fetchGamePrices}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading game prices...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gamePrices.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{game.game_name}</h3>
                    <p className="text-gray-500">{game.market_type}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="number"
                      value={game.game_amount}
                      onChange={(e) => handleChange(game.id, e)}
                      className="w-24 text-right"
                      disabled={isLoading || updatingGameId === game.id}
                    />
                    <Button
                      onClick={() => handleUpdate(game.id)}
                      disabled={isLoading || updatingGameId === game.id}
                      variant="default"
                    >
                      {updatingGameId === game.id ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamePricesPage;