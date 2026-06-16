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

// ====== 🤖 注入 Gemini AI 視覺辨識大腦 (Supabase 安全盾牌版) ======
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
    aiResultDiv.innerHTML = '✨ 正在透過 Supabase 安全通道傳送至 Gemini...';

    try {
      // 壓縮圖片
      const base64Content = await resizeAndGetBase64(file, 1024);

      // 🔐 改為呼叫我們剛剛在 Supabase 建立的安全後台函數 (RPC)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/analyze_receipt_with_gemini`, {
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

      if (!response.ok) {
        throw new Error(`後台通道回應異常，請檢查 SQL 是否成功 Run。`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`後台錯誤：${result.error.message}`);
      }

      // 解析 Gemini 回傳的標準格式
      const aiText = result.candidates[0].content.parts[0].text;
      aiResultDiv.innerHTML = `<strong>🤖 AI 智慧辨識成果：</strong><br><br>${aiText.replace(/\n/g, '<br>')}`;

    } catch (error) {
      console.error(error);
      aiResultDiv.innerHTML = `❌ 辨識失敗。<br>原因：${error.message || error}<br><br>💡 請確保 Supabase SQL 填入的金鑰完全正確！`;
    } finally {
      btnAllowance.innerText = '📷 拍下日本收據辨識';
      btnAllowance.disabled = false;
    }
  });
}

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

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Url = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64Url.split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
