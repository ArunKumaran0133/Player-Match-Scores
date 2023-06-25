const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started...");
    });
  } catch (error) {
    console.log(`Server Get An Error ${error}`);
    process.exit(1);
  }
};

initializeServerAndDB();

// Returns a list of all the players in the player table API.>>>

app.get("/players/", async (request, response) => {
  const listOfPLayerQuery = `
        SELECT *
        FROM player_details;
    `;
  const convertToList = (eachPlayer) => {
    return {
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    };
  };
  const dbResponse = await db.all(listOfPLayerQuery);
  response.send(dbResponse.map((eachPlayer) => convertToList(eachPlayer)));
});

//Returns a specific player based on the player ID API.>>>

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPLayerDetailsQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};
    `;

  const dbResponse = await db.get(getPLayerDetailsQuery);
  response.send({
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  });
});

//Updates the details of a specific player based on the player ID API.>>>

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
        UPDATE player_details
        SET 
            player_name = '${playerName}'
        
        WHERE player_id = ${playerId};
    `;
  const dbResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match API.>>>

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetailsQuery = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};
    `;

  const dbResponse = await db.get(getMatchDetailsQuery);
  response.send({
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  });
});

//Returns a list of all the matches of a player API.>>>

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const query = `
        SELECT *
        FROM player_match_score JOIN match_details
        WHERE player_id = ${playerId};
    `;
  const dbResponse = await db.all(query);
  const convertToListOfMatches = (eachMatch) => {
    return {
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    };
  };
  response.send(
    dbResponse.map((eachMatch) => convertToListOfMatches(eachMatch))
  );
});

//Returns a list of players of a specific match API.>>>

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const query = `
    SELECT player_details.player_id AS playerId,player_details.player_name AS playerName
    FROM player_match_score JOIN player_details
    WHERE player_match_score.match_id = ${matchId};
    `;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID API.>>>

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(player_match_score.fours) AS totalFours,SUM(player_match_score.sixes) totalSixes
    FROM player_match_score JOIN player_details
    WHERE player_details.player_id = ${playerId};
    `;
  const dbResponse = await db.all(query);
  response.send(dbResponse);
});

module.exports = app;
