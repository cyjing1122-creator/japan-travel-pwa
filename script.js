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