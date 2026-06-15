const SUPABASE_URL = "https://nugfehfgdbhdmvbhkreh.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_XXDW6OCZOgVCsOSzuSYUeg_IP7jtdCN";

let currentPrice = 99; 

window.onload = () => {
  const options = document.querySelectorAll('.plan-options .option');
  const tripBtn = document.getElementById("btn-trip");

  if (options && options.length >= 2) {
    const planLeft = options[0];  
    const planRight = options[1]; 

    planLeft.onclick = () => {
      currentPrice = 99;
      planLeft.classList.add('active');
      planRight.classList.remove('active');
    };

    planRight.onclick = () => {
      currentPrice = 399; 
      planRight.classList.add('active');
      planLeft.classList.remove('active');
    };
  }

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
const GEMINI_API_KEY = 'AQ.Ab8RN6JruZWB1SYeisb1aMQd2Kkqep1-eH5j7afacf_kuFemmw'; 
const receiptInput = document.getElementById('receipt-file');
const btnAllowance = document.getElementById('btn-allowance');
const aiResultDiv = document.getElementById('ai-result');

if (btnAllowance) {
  btnAllowance.addEventListener('click', () => {
    receiptInput.click();
  });
}

if (receiptInput) {
  receiptInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    btnAllowance.innerText = '⏳ AI 正在瘋狂辨識中...';
    btnAllowance.disabled = true;
    aiResultDiv.style.display = 'block';
    aiResultDiv.innerHTML = '✨ 正在將圖片安全傳送至 Google Gemini 雲端分析...';

    try {
      const base64Data = await window.toBase64(file);
      const base64Content = base64Data.split(',')[1];
      const mimeType = file.type;

      const promptText = "你是一位精通日文與日本稅務的記帳助理。請幫我精準分析這張日本收據或發票。請提取並用繁體中文回傳以下資訊：1. 店家名稱、2. 消費日期、3. 總消費金額 (含稅，請同時標示日圓及約略台幣換算)。如果可以，請簡短列出購買的核心商品清單。請用乾淨、條列式的日系極簡排版呈現，不要給任何多餘的社交寒暄。";

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
      
      if (result.error) {
        throw new Error(`${result.error.status || 'API錯誤'} - ${result.error.message}`);
      }

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('Gemini 沒有回傳任何辨識內容，請確認圖片是否清晰。');
      }

      const aiText = result.candidates[0].content.parts[0].text;
      aiResultDiv.innerHTML = `<strong>🤖 AI 智慧辨識成果：</strong><br><br>${aiText.replace(/\n/g, '<br>')}`;

    } catch (error) {
      console.error(error);
      // 這裡會直接把真正的錯誤原因吐在畫面上，我們就不用瞎猜了！
      aiResultDiv.innerHTML = `❌ 系統通訊失敗。<br>原因：${error.message || error}<br><br>請確認金鑰無誤，或用手機開啟「無痕分頁」測試以避開舊網頁快取。`;
    } finally {
      btnAllowance.innerText = '📷 拍下日本收據辨識';
      btnAllowance.disabled = false;
    }
  });
}

window.toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
