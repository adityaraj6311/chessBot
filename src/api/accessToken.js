import axios from "axios";

export default async () => {
  const headers = {
    "User-Agent":
      "Chesscom-Android/4.6.38-googleplay (Android/9; 2203121C; en_US; contact #android in Slack)",
    "x-chesscom-ps-id": "dc8c3c3c-d172-4600-951d-2cd0c2062e3b",
    "X-Client-Version": "Android4.6.38",
    Host: "api.chess.com",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "gzip",
    "Accept-Language": "en-US",
    Connection: "Keep-Alive",
  };

  const body =
    "usernameOrEmail=gojosatoru3221%40proton.me&password=Heheboi321%23&deviceId=a53ce70617e54791af5797a8013083ee&clientId=1bc9f2f2-4961-11ed-8971-f9a8d47c7a48";

  const res = await axios.get(
    "https://api.chess.com/v1/users/login?signed=Android4.6.38",
    body,
    { headers }
  );

  return res.data.data.oauth.access_token;
};
