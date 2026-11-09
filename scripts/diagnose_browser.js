import { spawn } from 'node:child_process';

async function diagnose() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9225;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    'https://habits.balears.tech/',
  ]);

  // Wait for Chrome page target
  let pageWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        pageWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!pageWsUrl) {
    console.error('Failed to get page WebSocket URL');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connected to Page WebSocket at:', pageWsUrl);

  const ws = new WebSocket(pageWsUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const errors = [];
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleMessages.push(`[Console ${data.params.type.toUpperCase()}]: ${text}`);
      console.log(`[Console ${data.params.type.toUpperCase()}]:`, text);
      if (data.params.type === 'error') {
        errors.push(text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
      console.error(`[Uncaught Exception]:`, desc);
      errors.push(desc);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  // Wait 5 seconds for page load and API requests
  await new Promise((r) => setTimeout(r, 5000));

  // Inspect DOM and localStorage
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const root = document.getElementById('root');
      return {
        rootHtmlLength: root ? root.innerHTML.length : 0,
        rootChildren: root ? root.children.length : 0,
        bodyTextSnippet: document.body.innerText.slice(0, 400),
        localStorageKeys: Object.keys(localStorage),
        currentUrl: window.location.href,
      };
    })()`,
    returnByValue: true,
  });

  const val = evalResult?.result?.value ?? evalResult?.value ?? {};
  console.log('\n================ RESULT ================');
  console.log('Current URL:', val.currentUrl);
  console.log('Root Children:', val.rootChildren);
  console.log('Root HTML Length:', val.rootHtmlLength);
  console.log('Local Storage Keys:', val.localStorageKeys);
  console.log('Body Text Snippet:\n', val.bodyTextSnippet);
  console.log('Console Errors:', errors.length);
  console.log('========================================\n');

  ws.close();
  chromeProc.kill();
  process.exit(errors.length > 0 ? 1 : 0);
}

diagnose().catch((e) => {
  console.error(e);
  process.exit(1);
});
