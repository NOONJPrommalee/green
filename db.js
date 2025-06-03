const supabaseClient = supabase.createClient(
  'https://vcllufadcckpqjxjkgly.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGx1ZmFkY2NrcHFqeGprZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTQ3MDEsImV4cCI6MjA2MDM5MDcwMX0.Za2yvSWmqRxw_3RcphpVNISsTRvyFGVNu6F869zCGgE' // เปลี่ยนเป็น key ของคุณ
);

const yearSelect = document.getElementById('yearSelect');

let chartInstance = null;

async function loadChart() {
  const { data, error } = await supabaseClient.from('purchases').select('*');
  if (error) {
    console.error(error);
    return;
  }

  // ดึงเฉพาะปี
  if (!window.yearsLoaded) {
    populateYearOptions(data);
    window.yearsLoaded = true;
  }

  const selectedYear = yearSelect.value;
  const filtered = selectedYear
    ? data.filter(row => row.month.startsWith(selectedYear))
    : data;

const totalByDept = {};
const friendlyByDept = {};

filtered.forEach(row => {
  const dept = row.department;
  const qty = row.qty || 0;
  if (!totalByDept[dept]) {
    totalByDept[dept] = 0;
    friendlyByDept[dept] = 0;
  }
  totalByDept[dept] += qty;
  if (row.friendly) {
    friendlyByDept[dept] += qty;
  }
});



  let totalItems = 0;
let friendlyItems = 0;
let unfriendlyItems = 0;

filtered.forEach(row => {
  const qty = row.qty || 0;
  totalItems += qty;
  if (row.friendly) {
    friendlyItems += qty;
  } else {
    unfriendlyItems += qty;
  }
});

const percentFriendlyOverall = totalItems
  ? ((friendlyItems / totalItems) * 100).toFixed(2)
  : 0;

// แสดงผลบนการ์ด
document.getElementById('totalItems').textContent =
  `🧾 จัดซื้อทั้งหมด : ${totalItems.toLocaleString()} รายการ`;
document.getElementById('friendlyItems').textContent =
  `🌱 เป็นมิตร: ${friendlyItems.toLocaleString()} รายการ`;
document.getElementById('unfriendlyItems').textContent =
  `⚠️ ไม่เป็นมิตร: ${unfriendlyItems.toLocaleString()} รายการ`;
document.getElementById('friendlyPercentOverall').textContent =
  `📊 % เป็นมิตร กฟฉ.2: ${parseFloat(percentFriendlyOverall).toLocaleString()}%`;



  const labels = Object.keys(totalByDept);
  const totalData = labels.map(dept => totalByDept[dept]);
  const friendlyPercent = labels.map(dept => {
    const total = totalByDept[dept];
    const friendly = friendlyByDept[dept] || 0;
    return total ? ((friendly / total) * 100).toFixed(2) : 0;
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById('myChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        
        {
          label: '% เป็นมิตร',
          data: friendlyPercent,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          yAxisID: 'yPercent'
        }
      ]
    },
    options: {
      scales: {
        
        yPercent: {
          beginAtZero: true,
          position: 'right',
          max: 100,
          title: {
            display: true,
            text: '% เป็นมิตร'
          }
        }
      }
    }
  });
}

function populateYearOptions(data) {
  const years = [...new Set(data.map(row => row.month.split('-')[0]))];
  years.sort();

  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

yearSelect.addEventListener('change', loadChart);
loadChart();
