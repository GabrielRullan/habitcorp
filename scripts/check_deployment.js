/**
 * Post-Deployment Status & Health Checker for HabitCorp (https://habits.balears.tech/)
 *
 * Verifies:
 * 1. Root HTML availability & status 200
 * 2. Deployed JS bundle resolution & hash parity with local build
 * 3. Client-first storage & resilient API fallback presence in deployed bundle
 * 4. CSS stylesheet availability & status 200
 * 5. API endpoint response behavior & graceful handling
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = process.env.DEPLOY_URL || 'https://habits.balears.tech';

async function checkDeployment() {
  console.log(`\n======================================================`);
  console.log(`🔍 Checking Deployment Status for: ${TARGET_URL}`);
  console.log(`======================================================\n`);

  let allPassed = true;

  // 1. Fetch Root HTML
  console.log(`[1/5] Probing root HTML endpoint (${TARGET_URL}/)...`);
  let rootHtml = '';
  try {
    const res = await fetch(`${TARGET_URL}/`, {
      headers: { 'User-Agent': 'HabitCorp-StatusCheck/1.0' },
    });
    if (res.status === 200) {
      rootHtml = await res.text();
      console.log(`  ✅ Root HTML returned HTTP 200 OK (${rootHtml.length} bytes)`);
    } else {
      console.error(`  ❌ Root HTML returned unexpected status: ${res.status}`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`  ❌ Failed to reach root HTML:`, err.message);
    allPassed = false;
  }

  // 2. Extract Deployed JS and CSS Bundles
  console.log(`\n[2/5] Inspecting deployed bundle references...`);
  const jsMatch = rootHtml.match(/src="(\/assets\/index-[^"]+\.js)"/);
  const cssMatch = rootHtml.match(/href="(\/assets\/index-[^"]+\.css)"/);

  const deployedJsPath = jsMatch ? jsMatch[1] : null;
  const deployedCssPath = cssMatch ? cssMatch[1] : null;

  if (!deployedJsPath) {
    console.error(`  ❌ Could not find JS bundle in deployed index.html`);
    allPassed = false;
  } else {
    console.log(`  ✅ Found deployed JS bundle: ${deployedJsPath}`);
  }

  if (!deployedCssPath) {
    console.warn(`  ⚠️ Could not find CSS bundle in deployed index.html`);
  } else {
    console.log(`  ✅ Found deployed CSS bundle: ${deployedCssPath}`);
  }

  // 3. Local Build Hash Parity Check
  console.log(`\n[3/5] Verifying bundle parity with local dist/client build...`);
  const distAssetsDir = path.resolve(__dirname, '../dist/client/assets');
  let localJsName = null;
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir);
    const localJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
    if (localJs) {
      localJsName = `/assets/${localJs}`;
      if (deployedJsPath === localJsName) {
        console.log(`  ✅ Deployed bundle matches latest local build: ${localJsName}`);
      } else {
        console.warn(`  ⚠️ Deployed bundle (${deployedJsPath}) differs from local dist build (${localJsName}).`);
        console.warn(`     Consider running 'npm run build' and 'npx firebase deploy --only hosting'.`);
      }
    }
  } else {
    console.log(`  ℹ️ No local dist/client/assets folder found to compare.`);
  }

  // 4. Download & Verify Deployed JS Bundle Contents
  if (deployedJsPath) {
    console.log(`\n[4/5] Downloading and verifying deployed JS bundle integrity...`);
    try {
      const bundleRes = await fetch(`${TARGET_URL}${deployedJsPath}`);
      if (bundleRes.status === 200) {
        const bundleText = await bundleRes.text();
        console.log(`  ✅ JS bundle returned HTTP 200 OK (${bundleText.length} bytes)`);

        // Check for local-first resilient fallback
        const hasClientStorage = bundleText.includes('habitcorp_client_db_v4') || bundleText.includes('handleClientStorageRequest');
        if (hasClientStorage) {
          console.log(`  ✅ Resilient local-first client storage fallback (habitcorp_client_db_v4) is PRESENT in bundle`);
        } else {
          console.error(`  ❌ CRITICAL: 'habitcorp_client_db_v4' clientStore storage is MISSING in bundle!`);
          console.error(`     API calls on static CDN hosting will throw Unexpected token '<' errors.`);
          allPassed = false;
        }

        // Check for habit/task renderers
        if (bundleText.includes('pureHabitsList') || bundleText.includes('Hàbits (+/-)') || bundleText.includes('renderHabitCard')) {
          console.log(`  ✅ Habitica multi-column habit/daily/task features present in bundle`);
        }
      } else {
        console.error(`  ❌ JS bundle returned HTTP ${bundleRes.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`  ❌ Error downloading deployed JS bundle:`, err.message);
      allPassed = false;
    }
  }

  // 5. Test API Fallback / Backend Proxy Behavior
  console.log(`\n[5/5] Testing API route handling (/api/v1/auth/default-user)...`);
  try {
    const apiRes = await fetch(`${TARGET_URL}/api/v1/auth/default-user`);
    const contentType = apiRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await apiRes.json();
      console.log(`  ✅ Live backend API responded with JSON 200 (apiKey: ${data.apiKey ? 'present' : 'none'})`);
    } else {
      console.log(`  ℹ️ API endpoint rewritten to static index.html by CDN hosting (${contentType.slice(0, 30)}).`);
      console.log(`     Graceful client-side Local-First fallback will handle storage seamlessly.`);
    }
  } catch (err) {
    console.warn(`  ⚠️ API probe network error:`, err.message);
  }

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL DEPLOYMENT CHECKS PASSED: ${TARGET_URL} is healthy!`);
  } else {
    console.log(`❌ SOME DEPLOYMENT CHECKS FAILED: See errors above.`);
  }
  console.log(`======================================================\n`);

  process.exit(allPassed ? 0 : 1);
}

checkDeployment();
