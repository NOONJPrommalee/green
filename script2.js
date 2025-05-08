const form = document.getElementById('purchase-form');
const tableBody = document.getElementById('purchase-table-body');
const monthSelect = document.getElementById('month-select');
const departmentList = document.getElementById('department-list');
const formHeader = document.getElementById('form-header');
const SUPABASE_URL = 'https://vcllufadcckpqjxjkgly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGx1ZmFkY2NrcHFqeGprZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTQ3MDEsImV4cCI6MjA2MDM5MDcwMX0.Za2yvSWmqRxw_3RcphpVNISsTRvyFGVNu6F869zCGgE';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let purchaseList = [];
let selectedDepartment = null;
let editModeIndex = null;


function formatNumber(num) {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInteger(num) {
  return num.toLocaleString();
}

function createFilterInputs() {
  const headerRow = document.querySelector('#purchase-table thead tr');
  if (!headerRow) return;

  const filterRow = document.createElement('tr');
  const headers = ['ชื่อรายการ', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'ราคารวม', 'เป็นมิตร', ''];

  headers.forEach((header, index) => {
    const cell = document.createElement('th');
    if (header) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `ค้นหา ${header}`;
      input.dataset.index = index;
      input.addEventListener('input', applyFilters);
      cell.appendChild(input);
    }
    filterRow.appendChild(cell);
  });

  headerRow.parentNode.insertBefore(filterRow, headerRow.nextSibling);
}

function applyFilters() {
  const filters = Array.from(document.querySelectorAll('#purchase-table thead tr:nth-child(2) input')).map(input => input.value.toLowerCase());

  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let show = true;
    filters.forEach((filter, i) => {
      if (filter && cells[i] && !cells[i].textContent.toLowerCase().includes(filter)) {
        show = false;
      }
    });
    row.style.display = show ? '' : 'none';
  });
}

function renderTable() {
  const selectedMonth = monthSelect.value;
  tableBody.innerHTML = '';
  const filteredItems = purchaseList.filter(item => item.month === selectedMonth && (selectedDepartment === 'รวมทุกหน่วยงาน' || item.department === selectedDepartment));

  let totalQty = 0;
  let totalPrice = 0;
  let friendlyTotalQty = 0;
  let friendlyTotalPrice = 0;

  filteredItems.forEach((item, index) => {
    const row = document.createElement('tr');

    const itemTotal = item.qty * item.price;
    totalQty += item.qty;
    totalPrice += itemTotal;

    if (item.friendly) {
      friendlyTotalQty += item.qty;
      friendlyTotalPrice += itemTotal;
    }

    if (editModeIndex === index) {
      row.innerHTML = `
        <td><input type="text" value="${item.name}" id="edit-name" /></td>
        <td><input type="number" value="${item.qty}" id="edit-qty" /></td>
        <td><input type="text" value="${item.unit}" id="edit-unit" /></td>
        <td><input type="number" step="0.01" value="${item.price}" id="edit-price" /></td>
        <td>${formatNumber(itemTotal)}</td>
        <td><input type="checkbox" id="edit-friendly" ${item.friendly ? 'checked' : ''} /></td>
        <td>
          <button onclick="saveEdit(${index})">บันทึก</button>
          <button onclick="cancelEdit()">ยกเลิก</button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${formatInteger(item.qty)}</td>
        <td>${item.unit}</td>
        <td>${formatNumber(item.price)}</td>
        <td>${formatNumber(itemTotal)}</td>
        <td>${item.friendly ? '✔️' : ''}</td>
        <td>
          <button onclick="enableEdit(${index})">แก้ไข</button>
          <button onclick="deleteItem(${index})">ลบ</button>
        </td>
      `;
    }

    tableBody.appendChild(row);
  });

  if (filteredItems.length > 0) {
    const summaryRow = document.createElement('tr');
    summaryRow.style.fontWeight = 'bold';
    summaryRow.innerHTML = `
      <td colspan="1">รวม</td>
      <td>${formatInteger(totalQty)}</td>
      <td colspan="2"></td>
      <td>${formatNumber(totalPrice)}</td>
      <td colspan="2"></td>
    `;
    tableBody.appendChild(summaryRow);

    const friendlySummaryRow = document.createElement('tr');
    friendlySummaryRow.style.fontWeight = 'bold';
    friendlySummaryRow.style.backgroundColor = '#eafaf1';
    friendlySummaryRow.innerHTML = ` 
      <td colspan="1">รวม (เป็นมิตร)</td>
      <td>${formatInteger(friendlyTotalQty)}</td>
      <td colspan="2"></td>
      <td>${formatNumber(friendlyTotalPrice)}</td>
      <td colspan="2"></td>
    `;
    tableBody.appendChild(friendlySummaryRow);

    const percentFriendly = totalPrice > 0 ? (friendlyTotalPrice / totalPrice) * 100 : 0;
    const percentRow = document.createElement('tr');
    percentRow.style.fontWeight = 'bold';
    percentRow.style.backgroundColor = '#dceefb';
    percentRow.innerHTML = `
      <td colspan="7">เปอร์เซ็นต์ของรายการที่เป็นมิตร: ${percentFriendly.toFixed(2)}%</td>
    `;
    tableBody.appendChild(percentRow);
  }

  createFilterInputs();
}

function enableEdit(index) {
  editModeIndex = index;
  renderTable();
}

function cancelEdit() {
  editModeIndex = null;
  renderTable();
}

function saveEdit(index) {
  const name = document.getElementById('edit-name').value;
  const qty = parseFloat(document.getElementById('edit-qty').value);
  const unit = document.getElementById('edit-unit').value;
  const price = parseFloat(document.getElementById('edit-price').value);
  const friendly = document.getElementById('edit-friendly').checked;

  const selectedMonth = monthSelect.value;
  const visibleItems = purchaseList.filter(item => item.month === selectedMonth && (selectedDepartment === 'รวมทุกหน่วยงาน' || item.department === selectedDepartment));
  const itemToEdit = visibleItems[index];
  const realIndex = purchaseList.findIndex(
    i => i.name === itemToEdit.name &&
        i.qty === itemToEdit.qty &&
i.unit === itemToEdit.unit &&
i.price === itemToEdit.price &&
i.month === itemToEdit.month &&
i.department === itemToEdit.department
  );

  if (realIndex !== -1) {
    purchaseList[realIndex] = { ...purchaseList[realIndex], name, qty, unit, price, friendly };
    editModeIndex = null;
    renderTable();
  }
}

function deleteItem(index) {
  const selectedMonth = monthSelect.value;
  const visibleItems = purchaseList.filter(item => item.month === selectedMonth && (selectedDepartment === 'รวมทุกหน่วยงาน' || item.department === selectedDepartment));
  const itemToDelete = visibleItems[index];
  const realIndex = purchaseList.findIndex(
    i => i.name === itemToDelete.name &&
         i.qty === itemToDelete.qty &&
         i.unit === itemToDelete.unit &&
         i.price === itemToDelete.price &&
         i.month === itemToDelete.month &&
         i.department === itemToDelete.department
  );
  if (realIndex !== -1) {
    purchaseList.splice(realIndex, 1);
    renderTable();
  }
}

form.addEventListener('submit', async(e) => {
  e.preventDefault();
  const name = document.getElementById('item-name').value;
  const qty = parseFloat(document.getElementById('item-qty').value);
  const unit = document.getElementById('item-unit').value;
  const price = parseFloat(document.getElementById('item-price').value);
  const friendly = document.getElementById('item-friendly').checked;
  const month = monthSelect.value;

  if (!month || !selectedDepartment || selectedDepartment === 'รวมทุกหน่วยงาน') {
    alert('กรุณาเลือกเดือนและหน่วยงาน (ไม่รวม "รวมทุกหน่วยงาน") ก่อนเพิ่มรายการ');
    return;
  }

  purchaseList.push({ name, qty, unit, price, friendly, month, department: selectedDepartment });
  form.reset();
  renderTable();

  const { error } = await supabaseClient.from('purchases').insert([
    { name, qty, unit, price, friendly, month, department: selectedDepartment }
  ]);
  if (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึก:', error);
  } else {
    console.log('บันทึกข้อมูลลงฐานข้อมูลแล้ว');
  }

});

monthSelect.addEventListener('change', renderTable);

departmentList.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    selectedDepartment = e.target.textContent;

    Array.from(departmentList.children).forEach(li => li.classList.remove('active'));
    e.target.classList.add('active');

    formHeader.textContent = `รายการจัดซื้อ : ${selectedDepartment}`;

    renderTable();
  }
});


async function loadData() {
  const { data, error } = await supabaseClient.from('purchases').select('*');
  if (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } else {
    console.log('ข้อมูล:', data);
    purchaseList = data;
    renderTable();
  }
}

loadData();