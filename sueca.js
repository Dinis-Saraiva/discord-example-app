import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";

/**
 * @typedef {Object} SuecaLobby
 * @property {string|null} p1
 * @property {string|null} p2
 * @property {string|null} p3
 * @property {string|null} p4
 */

/** @type {Object.<string, SuecaLobby>} */
const activeGames = {};

export function getSuecaPlayerList(gameId) {
  const game = activeGames[gameId];

  if (!game) {
    return "Game not found.";
  }

  const players = Object.entries(game);
  let playerLines = "";
  let team1 = [];
  let team2 = [];

  players.forEach(([key, userId], index) => {
    const playerNum = index + 1;
    const display = userId ? `<@${userId}>` : "[Empty Slot]";
    playerLines += `- ${display} (Player ${playerNum})\n`;

    // Assign to teams: P1 & P3 vs P2 & P4
    if (playerNum === 1 || playerNum === 3) {
      team1.push(display);
    } else if (playerNum === 2 || playerNum === 4) {
      team2.push(display);
    }
  });

  return (
    `${playerLines}\n` +
    `**Team 1:** ${team1.join(" & ")}\n` +
    `**Team 2:** ${team2.join(" & ")}`
  );
}

export function handleSuecaComponent(id, res, req) {
  const { data } = req.body;
  const componentId = data.custom_id;

  if (componentId.startsWith("sueca_start_")) {
    console.log(">> Entering sueca start handler");
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Sueca game started! Good luck!",
        flags: InteractionResponseFlags.IS_COMPONENTS_V2,
        components: [],
      },
    });
  }
  if (componentId.startsWith("sueca_join_")) {
    console.log(">> Entering sueca join handler");

    const context = req.body.context;
    const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

    const gameId = componentId.replace("sueca_join_", "");
    const game = activeGames[gameId];

    if (!game) {
      return res.send({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: "Game not found or expired.",
        },
      });
    }

    // Add player to next available slot
    const alreadyJoined = Object.values(game).includes(userId);
    if (alreadyJoined) {
      return res.send({
        type: 4,
        data: {
          content: "You already joined the game.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }

    if (!game.p2) game.p2 = userId;
    else if (!game.p3) game.p3 = userId;
    else if (!game.p4) game.p4 = userId;
    else {
      return res.send({
        type: 4,
        data: {
          content: "Game is full!",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }

    const playerList = getSuecaPlayerList(gameId);
    const isFull = game.p1 && game.p2 && game.p3 && game.p4;
    // Update the original message with new player list
    return res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        components: [
          {
            type: MessageComponentTypes.TEXT_DISPLAY,
            content: `Sueca challenge from <@${game.p1}>\n\nCurrent players:\n${playerList}`,
          },
          {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: `sueca_join_${gameId}`,
                label: "Join Sueca",
                style: ButtonStyleTypes.PRIMARY,
                disabled: isFull,
              },
              {
                type: MessageComponentTypes.BUTTON,
                custom_id: `sueca_start_${gameId}`,
                label: "Start Game",
                style: ButtonStyleTypes.SUCCESS,
                disabled: !isFull,
              },
            ],
          },
        ],
      },
    });
  }
}

export function handlePlaySueca(id, res, req) {
  console.log(">> Entering handlePlaySueca");

  const context = req.body.context;
  const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

  activeGames[id] = {
    p1: userId,
    p2: null,
    p3: null,
    p4: null,
  };

  // Create player list string dynamically
  const playerList = getSuecaPlayerList(id);

  console.log("<< Exiting handlePlaySueca");

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: InteractionResponseFlags.IS_COMPONENTS_V2,
      components: [
        {
          type: MessageComponentTypes.TEXT_DISPLAY,
          content: `Sueca challenge from <@${userId}>\n\nCurrent players:\n${playerList}`,
        },
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.BUTTON,
              custom_id: `sueca_join_${req.body.id}`,
              label: "Join Sueca",
              style: ButtonStyleTypes.PRIMARY,
            },
            {
              type: MessageComponentTypes.BUTTON,
              custom_id: `sueca_start_${req.body.id}`,
              label: "Start Game",
              style: ButtonStyleTypes.SUCCESS,
              disabled: true,
            },
          ],
        },
      ],
    },
  });
}
