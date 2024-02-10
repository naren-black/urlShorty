import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = process.env.TABLE_NAME;

const generateShortUrl = () => {
  // Function to generate a random short URL
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `the-tiny.com/${result}`;
};


export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  console.log(`The path params: ${JSON.stringify(event.pathParameters, null, 4)}`);
  console.log();
  try {
    switch (event.routeKey) {
      case "GET /getShortUrl/{id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              id: Number(event.pathParameters.id),
            },
          })
        );
        body = body.Item;
        console.log(`The item at ${event.pathParameters.id} is ${body}`)
        break;
      case "POST /setShortUrl":
        let requestJSON = JSON.parse(event.body);
        console.log(requestJSON);
        let shortUrl = generateShortUrl();
        console.log(`Writing the URL: ${requestJSON.longUrl} to DDB as ${shortUrl}...`);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: requestJSON.id,
              longUrl: requestJSON.longUrl,
              shortUrl: shortUrl
            },
          })
        );
        body = `The item ${requestJSON.id} has been created..`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};