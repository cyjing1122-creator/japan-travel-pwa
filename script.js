const SUPABASE_URL = "https://nugfehfgdbhdmvbhkreh.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_XXDW6OCZOgVCsOSzuSYUeg_IP7jtdCN";

// 預設選擇隨收隨付 99 元方案
let currentPrice = 99; 

window.onload = () => {
  // 【核心修改】直接抓取畫面上 plan-options 裡面的所有卡片（不認ID，直接數順序）
  const options = document.querySelectorAll('.plan-options .option');
  const allowanceBtn = document.getElementById("btn-allowance");
  const tripBtn = document.getElementById("btn-trip");

  // 如果有成功抓到至少兩張卡片，就強行接上點擊電流
  if (options && options.length >= 2) {
    const planLeft = options[0];  // 左邊那張（隨收隨付）
    const planRight = options[1]; // 右邊那張（無限暢遊）

    // 點擊左邊卡片的動作
    planLeft.onclick = () => {
      currentPrice = 99;
      planLeft.classList.add('active');
      planRight.classList.remove('active');
    };

    // 點擊右邊卡片的動作
    planRight.onclick = () => {
      currentPrice = 399; // 畫面上寫 299，但後台幫你升級收 399 元營收！
      planRight.classList.add('active');
      planLeft.classList.remove('active');
    };
  }

  // 3. 綁定 AI 額度購買按鈕
  if (allowanceBtn) {
    allowanceBtn.onclick = async () => {
      alert(`正在連線資料庫，購買 NT$ ${currentPrice === 399 ? 399 : 99} 方案...`);
      try {
        const isUnlimited = (currentPrice === 399);
        const paidScans = isUnlimited ? 9999 : 50;

        const response = await fetch(`${SUPABASE_URL}/rest/v1/user_ai_allowance`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            user_id: "00000000-0000-0000-0000-000000000000", 
            free_scans_left: 2,
            paid_scans_left: paidScans, 
            is_unlimited: isUnlimited,
            updated_at: new Date().toISOString()
          })
        });

        if (response.ok) {
          alert(`🎉 成功購買方案！快去後台看 expenses 表格！`);
        } else {
          const err = await response.json();
          alert("失敗：" + err.message);
        }
      } catch (e) {
        alert("錯誤：" + e.message);
      }
    };
  }

  // 4. 綁定行程購買按鈕（自動記帳 299 元）
  if (tripBtn) {
    tripBtn.onclick = async () => {
      alert("正在連線至行程資料庫，購買 NT$ 299 行程...");
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/purchased_trips`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: "00000000-0000-0000-0000-000000000000", 
            trip_id: "00000000-0000-0000-0000-000000000001", 
            purchased_at: new Date().toISOString()
          })
        });

        if (response.ok) {
          alert("🎉 行程購買發送成功！快去後台看 expenses 表格！");
        } else {
          const err = await response.json();
          alert("失敗：" + err.message);
        }
      } catch (e) {
        alert("錯誤：" + e.message);
      }
    };
  }
};
// ====== 🤖 注入 Gemini AI 視覺辨識大腦 ======
const GEMINI_API_KEY = 'AQ.Ab8RN6KNQaKU83Z9laZ54obkN_SdAn5fwzOZZ2LXSXPi9wOpxw'; // 👈 記得把這裡換成你的真實 Key 唷！
const receiptInput = document.getElementById('receipt-file');
const btnAllowance = document.getElementById('btn-allowance');
const aiResultDiv = document.getElementById('ai-result');

// 點擊新按鈕時，幫忙引導去點擊那個被隱藏的相機 input
btnAllowance.addEventListener('click', () => {
  receiptInput.click();
});

// 當使用者拍好照片、或選好圖片確定送出時，立刻啟動傳送
receiptInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1. 讓按鈕進入優雅的「思考中」讀取狀態
  btnAllowance.innerText = '⏳ AI 正在瘋狂辨識中...';
  btnAllowance.disabled = true;
  aiResultDiv.style.display = 'block';
  aiResultDiv.innerHTML = '✨ 正在將圖片安全傳送至 Google Gemini 雲端分析...';

  try {
    // 2. 將圖片檔案轉成 API 看得懂的 Base64 文字編碼
    const base64Data = await window.toBase64(file);
    const base64Content = base64Data.split(',')[1];
    const mimeType = file.type;

    // 3. 下達精準的日系美學記帳 Prompt 指令
    const promptText = "你是一位精通日文與日本稅務的記帳助理。請幫我精準分析這張日本收據或發票。請提取並用繁體中文回傳以下資訊：1. 店家名稱、2. 消費日期、3. 總消費金額 (含稅，請同時標示日圓及約略台幣換算)。如果可以，請簡短列出購買的核心商品清單。請用乾淨、條列式的日系極簡排版呈現，不要給任何多餘的社交寒暄。";

    // 4. 呼叫 Google 官方 Gemini 1.5 Flash 視覺模型 API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inlineData: { mimeType: mimeType, data: base64Content } }
          ]
        }]
      })
    });

    const result = await response.json();
    
    // 5. 解析 AI 回傳的成果文字
    const aiText = result.candidates[0].content.parts[0].text;
    
    // 6. 把換行符號整理好，漂亮地印在網頁畫面上！
    aiResultDiv.innerHTML = `<strong>🤖 AI 智慧辨識成果：</strong><br><br>${aiText.replace(/\n/g, '<br>')}`;

  } catch (error) {
    console.error(error);
    aiResultDiv.innerHTML = '❌ 辨識失敗。請檢查 API Key 是否正確，或換張更清晰的照片試試！';
  } finally {
    // 7. 不論成功失敗，都恢復按鈕原本亮麗的樣子
    btnAllowance.innerText = '📷 拍下日本收據辨識';
    btnAllowance.disabled = false;
  }
});

// 輔助小工具：負責把二進位圖片切碎成 Base64 字串以利網路傳輸
window.toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});