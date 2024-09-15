// Strict Mode for better error checking
'use strict';

// Application State
const AppState = {
    familyMembers: [],
    currentMember: null,
    categories: [],
};

// DOM Elements
const dom = {
    familyMemberSelect: document.getElementById('family-member-select'),
    addFamilyMemberBtn: document.getElementById('add-family-member'),
    balanceInput: document.getElementById('balance-input'),
    budgetTimeframeSelect: document.getElementById('budget-timeframe'),
    setBudgetBtn: document.getElementById('set-budget'),
    resetBudgetBtn: document.getElementById('reset-budget'),
    totalBudgetSpan: document.getElementById('total-budget'),
    dailyLimitSpan: document.getElementById('daily-limit'),
    expenseAmountInput: document.getElementById('expense-amount'),
    expenseCategorySelect: document.getElementById('expense-category'),
    addExpenseBtn: document.getElementById('add-expense'),
    remainingBalanceSpan: document.getElementById('remaining-balance'),
    daysWithoutSpendingSpan: document.getElementById('days-without-spending'),
    spentTodaySpan: document.getElementById('spent-today'),
    daysNeededSpan: document.getElementById('days-needed'),
    weeklyReportDiv: document.getElementById('weekly-report'),
    newCategoryInput: document.getElementById('new-category'),
    addCategoryBtn: document.getElementById('add-category'),
    saveCategoriesBtn: document.getElementById('save-categories'),
    toastContainer: document.getElementById('toast-container'),
    addMemberModal: document.getElementById('add-member-modal'),
    newMemberNameInput: document.getElementById('new-member-name'),
    submitNewMemberBtn: document.getElementById('submit-new-member'),
    closeModalBtn: document.querySelector('.close'),
    exportDataBtn: document.getElementById('export-data'),
    importDataBtn: document.getElementById('import-data'),
    importFileInput: document.getElementById('import-file'),
};

// Helper Functions

// Show toast message
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            dom.toastContainer.removeChild(toast);
        }, 500);
    }, duration);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Save AppState to localStorage
function saveAppState() {
    localStorage.setItem('AppState', JSON.stringify(AppState));
}

// Load AppState from localStorage
function loadAppState() {
    const storedState = localStorage.getItem('AppState');
    if (storedState) {
        const parsedState = JSON.parse(storedState);
        AppState.familyMembers = parsedState.familyMembers || [];
        AppState.categories = parsedState.categories || ['Food', 'Transportation', 'Utilities', 'Entertainment', 'Other'];
    } else {
        AppState.categories = ['Food', 'Transportation', 'Utilities', 'Entertainment', 'Other'];
    }
}

// Update family member select options
function updateFamilyMemberSelect() {
    dom.familyMemberSelect.innerHTML = '<option value="">Select a family member</option>';
    AppState.familyMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        dom.familyMemberSelect.appendChild(option);
    });
}

// Update category select options
function updateCategorySelect() {
    dom.expenseCategorySelect.innerHTML = '<option value="">Select category</option>';
    AppState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dom.expenseCategorySelect.appendChild(option);
    });
}

// Disable or enable input fields based on member selection
function toggleInputs(enabled) {
    dom.setBudgetBtn.disabled = !enabled;
    dom.resetBudgetBtn.disabled = !enabled;
    dom.addExpenseBtn.disabled = !enabled;
    dom.addCategoryBtn.disabled = !enabled;
    dom.saveCategoriesBtn.disabled = !enabled;
}

// Select family member
function selectFamilyMember(memberId) {
    const member = AppState.familyMembers.find(m => m.id === memberId);
    if (member) {
        AppState.currentMember = member;
        dom.balanceInput.value = member.budget.startingBalance || '';
        dom.budgetTimeframeSelect.value = member.budget.timeframe || '30';
        updateBudgetInfo();
        updateExpenseSummary();
        generateWeeklyReport();
        toggleInputs(true);
    } else {
        AppState.currentMember = null;
        toggleInputs(false);
    }
}

// Add new family member
function addFamilyMember(name) {
    const newMember = {
        id: `member-${Date.now()}`,
        name: name,
        budget: {},
        expenses: [],
    };
    AppState.familyMembers.push(newMember);
    saveAppState();
    updateFamilyMemberSelect();
    dom.familyMemberSelect.value = newMember.id;
    selectFamilyMember(newMember.id);
    showToast(`Family member "${name}" added.`);
}

// Set budget for current member
function setBudget() {
    const balance = parseFloat(dom.balanceInput.value);
    const timeframe = parseInt(dom.budgetTimeframeSelect.value);

    if (isNaN(balance) || balance <= 0) {
        showToast('Please enter a valid starting balance.', 'error');
        return;
    }

    if (!timeframe) {
        showToast('Please select a valid budget timeframe.', 'error');
        return;
    }

    AppState.currentMember.budget = {
        startingBalance: balance,
        timeframe: timeframe,
        dailyLimit: balance / timeframe,
        startDate: new Date().toISOString(),
    };

    saveAppState();
    updateBudgetInfo();
    showToast('Budget set successfully.');
}

// Reset budget for current member
function resetBudget() {
    if (!AppState.currentMember.budget.startingBalance) {
        showToast('No budget to reset. Please set a budget first.', 'error');
        return;
    }

    AppState.currentMember.budget.startingBalance = parseFloat(dom.balanceInput.value);
    AppState.currentMember.budget.startDate = new Date().toISOString();
    AppState.currentMember.expenses = [];

    saveAppState();
    updateBudgetInfo();
    updateExpenseSummary();
    generateWeeklyReport();
    showToast('Budget reset successfully.');
}

// Update budget information display
function updateBudgetInfo() {
    const budget = AppState.currentMember.budget;
    if (budget && budget.startingBalance) {
        dom.totalBudgetSpan.textContent = formatCurrency(budget.startingBalance);
        dom.dailyLimitSpan.textContent = formatCurrency(budget.dailyLimit);
    } else {
        dom.totalBudgetSpan.textContent = '₹0.00';
        dom.dailyLimitSpan.textContent = '₹0.00';
    }
}

// Add expense for current member
function addExpense() {
    const amount = parseFloat(dom.expenseAmountInput.value);
    const category = dom.expenseCategorySelect.value;

    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid expense amount.', 'error');
        return;
    }

    if (!category) {
        showToast('Please select an expense category.', 'error');
        return;
    }

    const remainingBalance = calculateRemainingBalance();
    if (amount > remainingBalance) {
        showToast('Expense exceeds remaining balance.', 'error');
        return;
    }

    const newExpense = {
        id: `expense-${Date.now()}`,
        amount: amount,
        category: category,
        date: new Date().toISOString(),
    };

    AppState.currentMember.expenses.push(newExpense);
    saveAppState();
    dom.expenseAmountInput.value = '';
    dom.expenseCategorySelect.value = '';
    updateExpenseSummary();
    generateWeeklyReport();
    checkDailyLimit();
    showToast('Expense added successfully.');
}

// Calculate remaining balance
function calculateRemainingBalance() {
    const budget = AppState.currentMember.budget;
    const totalExpenses = AppState.currentMember.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return budget.startingBalance - totalExpenses;
}

// Update expense summary display
function updateExpenseSummary() {
   
