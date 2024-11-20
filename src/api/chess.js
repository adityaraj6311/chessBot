import axios from "axios";
import { Config } from "../db.js";
import getAccessToken from "./accessToken.js";

class Chess {
  constructor() {
    this.header = {};
  }

  async initialize() {
    const config = await Config.findOne({});
    if (config && config.accessToken) {
      this.header = {
        Authorization: `Bearer ${config.accessToken}`,
      };
    } else {
      const newAccessToken = await getAccessToken();
      await Config.updateOne(
        {},
        { $set: { accessToken: newAccessToken } },
        { upsert: true }
      );
      this.header = {
        Authorization: `Bearer ${newAccessToken}`,
      };
    }
  }

  async getFlagEmoji(apiCountryCode) {
    const res = await axios.get(apiCountryCode)
    const countryCode = res.data.code;
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints) + " " + res.data.name;
  }

  async getProfile(gameUserName) {
    return (await axios.get(`https://api.chess.com/pub/player/${gameUserName}`))
      .data;
  }

  async getCallbackProfile(gameUserName) {
    try {
      return (await axios.get(`https://www.chess.com/callback/user/popup/${gameUserName}`))
        .data;
    } catch (error) {
      return null;
    }
  }

  async getBio(gameUserName) {
    try {
      return (await axios.get(`https://api.chess.com/v1/users/flair-status?username=${gameUserName}&signed=Android4.6.38`)).data.data.status;
    } catch (error) {
      return null;
    }
  }

  async getStats(gameUserName) {
    return (
      await axios.get(`https://api.chess.com/pub/player/${gameUserName}/stats`)
    ).data;
  }

  async getFriends(gameUserName) {
    const res = await axios.get(
      `https://api.chess.com/v1/friends?username=${gameUserName}&limit=10&signed=Android4.6.38`,
      {
        headers: this.header,
      }
    );

    // Reset token if unauthorized
    if (res.status === 401) {
      const newAccessToken = await getAccessToken();
      await Config.updateOne(
        {},
        { $set: { accessToken: newAccessToken } },
        { upsert: true }
      );
      await this.initialize();
      return await this.getFriends(gameUserName);
    }

    return res.data;
  }

  async getOngoingGames(gameUserName) {
    return (
      await axios.get(`https://api.chess.com/pub/player/${gameUserName}/games`)
    ).data;
  }

  async availableArchiveDates(gameUserName) {
    return (
      await axios.get(
        `https://api.chess.com/pub/player/${gameUserName}/games/archives`
      )
    ).data;
  }

  async getGameArchive(gameUserName, year, month) {
    return (
      await axios.get(
        `https://api.chess.com/pub/player/${gameUserName}/games/${year}/${month}`
      )
    ).data;
  }
}

export default new Chess();
