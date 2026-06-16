// ====== 🌐 Supabase 環境設定 ======
const SUPABASE_URL = "https://nugfehfgdbhdmvbhkreh.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_XXDW6OCZOgVCsOSzuSYUeg_IP7jtdCN";

let currentPrice = 99; 

// ====== ⚡ 網頁載入後的初始化事件 ======
window.onload = () => {
  const options = document.querySelectorAll('.plan-options .option');
  const tripBtn = document.getElementById("btn-trip");

  // 1. 處理訂閱方案切換 (NT$ 99 / 399)
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

  // 2. 處理購買行程按鈕 (NT$ 299)
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

// ====== 🤖 Gemini AI 視覺辨識 (Supabase Edge Function 完美對接版) ======
const receiptInput = document.getElementById('receipt-file');
const btnAllowance = document.getElementById('btn-allowance');
const aiResultDiv = document.getElementById('ai-result');

// 點擊「拍下日本收據辨識」按鈕時，觸發隱藏的檔案選擇器
if (btnAllowance) {
  btnAllowance.addEventListener('click', () => {
    receiptInput.click();
  });
}

// 當使用者拍好照片或選好檔案時觸發
if (receiptInput) {
  receiptInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 進入載入狀態，防止重複點擊
    btnAllowance.innerText = '⏳ AI 正在瘋狂辨識中...';
    btnAllowance.disabled = true;
    aiResultDiv.style.display = 'block';
    aiResultDiv.innerHTML = '✨ 正在透過 Supabase 獨立雲端函式直送 Gemini...';

    try {
      // 1. 在前端將照片優化縮放，確保手機上傳流暢不卡頓
      const base64Content = await resizeAndGetBase64(file, 1024);

      // 2. 精準呼叫我們剛剛在 Supabase 雲端建好的 Edge Function (analyze-receipt)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-receipt`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_base64: base64Content
        })
      });

      const result = await response.json();
      
      // 檢查雲端回傳是否有錯誤
      if (result.error || result.error_details) {
        throw new Error(result.error || '雲端函式解析發生異常');
      }

      // 3. 解析 Gemini 標準回傳的資料格式並渲染到畫面上
      if (result.candidates && result.candidates[0]) {
        const aiText = result.candidates[0].content.parts[0].text;
        // 將換行符號轉為網頁的 <br> 標籤，保留漂亮的日系極簡排版
        aiResultDiv.innerHTML = `<strong>🤖 AI 智慧辨識成果：</strong><br><br>${aiText.replace(/\n/g, '<br>')}`;
      } else {
        throw new Error('未能成功取得辨識文字，請確認金鑰狀態。');
      }

    } catch (error) {
      console.error(error);
      aiResultDiv.innerHTML = `❌ 辨識失敗。<br>原因：${error.message || error}<br><br>💡 後台機制已順利對接，請確認專案環境無鎖定。`;
    } finally {
      // 恢復按鈕狀態
      btnAllowance.innerText = '📷 拍下日本收據辨識';
      btnAllowance.disabled = false;
    }
  });
}

// ====== 🖼️ 圖片壓縮與 Base64 轉換工具函數 ======
function resizeAndGetBase64(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 計算縮放比例
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 壓縮成 70% 品質的 JPEG
        const base64Url = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64Url.split(',')[1]); // 只要純 Base64 字串部分
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
