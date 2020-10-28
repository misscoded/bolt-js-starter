import { App } from "@slack/bolt";
import { config } from "dotenv";

config();
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

/**
 * Commands are slash command events (like "/invite" and "/shrug")
 * that your Slack app can listen and respond to. To create commands,
 * see the Slash Commands section in your app's configuration.
 * https://slack.dev/bolt-js/concepts#commands
 */
app.command('/greet', async ({ command, ack, say }) => {
  await ack();
  await say(`Why, hello there! :simple_smile:`);
});

/**
 * Messages can be listened for, using specific words and phrases. 
 * Note: your Slack app *must* be subscribed to the following 
 * events, and have access to the channels where they occur!
 * See the Event Subscriptions section of your app's configuration
 * https://slack.dev/bolt-js/concepts#message-listening
 */
app.message('hello', async ({ message, say }) => {
  await say(`Hello, <@${message.user}>!`);
});

app.message(/^(bye|goodbye|cya).*/, async ({ message, say }) => {
  await say(`See you later, <@${message.user}>!`);
});

/**
 * Shortcuts can be global (accessible from anywhere in Slack), 
 * or specific to messages (shown only in message context menus).
 * Shortcuts can trigger both modals and other app interactions.
 * https://slack.dev/bolt-js/concepts#shortcuts
 */
app.shortcut('modal_shortcut', async ({ ack, shortcut, client }) => {
  await ack();

  const { user, trigger_id } = shortcut;

  await client.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: 'modal_shortcut_view',
      title: {
        type: 'plain_text',
        text: 'Sample Modal Title',
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "This modal was triggered by a shortcut. Clicking the button below will use `app.action()` to update the view."
          }
        },
        {
          type: "divider"
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Click to change modal's text!"
              },
              value: "click_me",
              action_id: "change_modal_message"
            }
          ],
        },
      ],
      submit: {
        type: 'plain_text',
        text: 'Submit'
      },
    },
  });
});

app.shortcut('message_shortcut', async ({ ack, shortcut, client }) => {
  await ack();

  // @ts-ignore
  // TODO :: channel and message not off shortcut?
  const { user, channel, message } = shortcut;

  // Grab link to message that shortcut was triggered off of 
  const { permalink } = await client.chat.getPermalink({
    channel: channel.id,
    message_ts: message.ts
  });

  // Send DM to user that used the shortcut
  client.chat.postMessage({
    channel: user.id,
    text: `You just triggered the message shortcut on the following message in the ${channel.name}: ${permalink}`,
  });
});

/**
 * Views (modals) trigger a view_submission event when they are submitted. 
 * Note: for this event to occur, your view must include a Submit button.
 * https://slack.dev/bolt-js/concepts#view_submissions
 */
app.view('modal_shortcut_view', async ({ ack, body, view, client }) => {
  await ack();

  const { user } = body;

  client.chat.postMessage({
    channel: user.id,
    text: "The modal was submitted and now you're getting this message!"
  });
});

/**
 * Actions are interactive events that include button clicks, 
 * menu selects, and other elements a user might interact with. 
 * https://slack.dev/bolt-js/concepts#action-listening
 */
app.action('change_modal_message', async ({ ack, body, client, action }) => {
  await ack();

  // @ts-ignore
  // TODO :: view not off body?
  const { view } = body;

  client.views.update({
    view_id: view.id,
    view: {
      type: 'modal',
      callback_id: 'modal_shortcut_view',
      title: {
        type: 'plain_text',
        text: 'Sample Modal Title',
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Annnnd there we go -- updated! :upside_down_face:"
          }
        },
      ],
      submit: {
        type: 'plain_text',
        text: 'Submit'
      },
    },
  });
});

/**
 * You can subscribe to any event that is offered by the Events API
 * Note: your Slack app *must* be subscribed to the following events!
 * See the Event Subscriptions section of your app's configuration
 * https://slack.dev/bolt-js/concepts#event-listening
 */
app.event('app_home_opened', async ({ event, context }) => {
  console.log(`Your application's App Home tab has been opened!`);
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running! ⚡️');
})();
