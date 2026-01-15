// 麻将牌定义
const cardTypes = {
    wanzi: ['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万'],
    tiaozi: ['1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条'],
    tongzi: ['1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒'],
    zapai: ['东', '南', '西', '北', '中', '发', '白']
};

// 番型定义（不同规则下的番数）
const fanDefinitions = {
    national: {
        // 基础番型
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 4, type: 'medium' },
        qingyise: { name: '清一色', fan: 6, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 4, type: 'medium' },
        longqidui: { name: '龙七对', fan: 8, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 8, type: 'high' },
        haidilaoyue: { name: '海底捞月', fan: 8, type: 'high' },
        
        // 国标特殊番型
        yitiaolong: { name: '一条龙', fan: 3, type: 'medium' },
        jinshen: { name: '金身', fan: 1, type: 'base' }
    },
    sichuan: {
        // 四川麻将番型
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 2, type: 'medium' },
        qingyise: { name: '清一色', fan: 4, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 4, type: 'high' },
        longqidui: { name: '龙七对', fan: 8, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 1, type: 'medium' },
        haidilaoyue: { name: '海底捞月', fan: 1, type: 'medium' },
        
        // 四川麻将特殊番型
        duotiao: { name: '带幺', fan: 1, type: 'base' },
        quanshun: { name: '全顺', fan: 1, type: 'base' }
    },
    guangdong: {
        // 广东麻将番型
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 3, type: 'medium' },
        qingyise: { name: '清一色', fan: 5, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 5, type: 'high' },
        longqidui: { name: '龙七对', fan: 10, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 2, type: 'medium' },
        haidilaoyue: { name: '海底捞月', fan: 2, type: 'medium' },
        
        // 广东麻将特殊番型
        zimo: { name: '自摸', fan: 1, type: 'base' },
        menqing: { name: '门清', fan: 1, type: 'base' }
    }
};

// 选中的手牌
let selectedCards = [];
// 当前选中的规则
let currentRule = 'national';
// 特殊牌型标记
let specialFlags = {
    gangshanghua: false,
    haidilaoyue: false
};
// 四川麻将定缺
let lackType = 'none';

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 生成麻将牌
    generateCards();
    
    // 绑定按钮事件
    document.getElementById('analyze-btn').addEventListener('click', analyzeHand);
    document.getElementById('reset-btn').addEventListener('click', resetHand);
    
    // 绑定规则选择事件
    document.getElementById('rule-selector').addEventListener('change', (e) => {
        currentRule = e.target.value;
        updateRuleUI();
    });
    
    // 绑定四川麻将定缺选择事件
    document.getElementById('lack-selector').addEventListener('change', (e) => {
        lackType = e.target.value;
        updateLackCards();
    });
    
    // 绑定特殊牌型复选框事件
    document.getElementById('gangshanghua').addEventListener('change', (e) => {
        specialFlags.gangshanghua = e.target.checked;
    });
    
    document.getElementById('haidilaoyue').addEventListener('change', (e) => {
        specialFlags.haidilaoyue = e.target.checked;
    });
    
    // 初始化规则UI
    updateRuleUI();
});

// 更新规则相关UI
function updateRuleUI() {
    // 显示/隐藏四川麻将选项
    const sichuanOptions = document.getElementById('sichuan-options');
    const zapaiSection = document.getElementById('zapai-section');
    
    if (currentRule === 'sichuan') {
        sichuanOptions.classList.remove('hidden');
        zapaiSection.classList.add('hidden'); // 四川麻将通常无门风字牌
        updateLackCards(); // 更新定缺牌
    } else {
        sichuanOptions.classList.add('hidden');
        zapaiSection.classList.remove('hidden');
        
        // 启用所有牌
        document.querySelectorAll('.ma-card.disabled').forEach(card => {
            card.classList.remove('disabled');
        });
    }
}

// 更新定缺牌显示
function updateLackCards() {
    // 先启用所有牌
    document.querySelectorAll('.ma-card.disabled').forEach(card => {
        card.classList.remove('disabled');
    });
    
    // 根据定缺禁用对应牌
    if (lackType !== 'none' && currentRule === 'sichuan') {
        const containerId = `${lackType}zi-container`;
        const cards = document.querySelectorAll(`#${containerId} .ma-card`);
        cards.forEach(card => {
            card.classList.add('disabled');
            
            // 如果定缺牌被选中，取消选中
            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                const cardName = card.dataset.card;
                selectedCards = selectedCards.filter(c => c !== cardName);
            }
        });
        
        // 检查相公状态
        checkXianggong();
    }
}

// 生成麻将牌元素
function generateCards() {
    // 遍历每种牌型
    for (const [type, cards] of Object.entries(cardTypes)) {
        const container = document.getElementById(`${type}-container`);
        
        // 为每张牌创建元素
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'ma-card';
            cardElement.textContent = card;
            cardElement.dataset.card = card;
            
            // 绑定点击事件
            cardElement.addEventListener('click', () => {
                toggleCardSelection(cardElement, card);
            });
            
            container.appendChild(cardElement);
        });
    }
}

// 切换牌的选中状态
function toggleCardSelection(element, card) {
    // 跳过禁用的牌
    if (element.classList.contains('disabled')) return;
    
    // 检查当前牌的选中数量
    const currentCount = selectedCards.filter(c => c === card).length;
    
    // 每张牌最多选4张
    if (element.classList.contains('selected')) {
        // 取消选中
        element.classList.remove('selected');
        selectedCards = selectedCards.filter(c => c !== card);
    } else if (currentCount < 4) {
        // 选中
        element.classList.add('selected');
        selectedCards.push(card);
    } else {
        showStatus('每种牌最多只能选4张！', 'warning');
    }
    
    // 实时检查相公状态
    checkXianggong();
}

// 检查大小相公
function checkXianggong() {
    const cardCount = selectedCards.length;
    const statusAlert = document.getElementById('status-alert');
    
    // 正常胡牌应该是13张（听牌）或14张（胡牌）
    if (cardCount === 13 || cardCount === 14) {
        statusAlert.classList.add('hidden');
        return false;
    }
    
    // 显示相公提示
    statusAlert.classList.remove('hidden');
    statusAlert.className = 'mb-6 p-4 rounded-lg';
    
    if (cardCount < 13) {
        statusAlert.classList.add('alert-warning');
        statusAlert.textContent = `少相公！还差 ${13 - cardCount} 张牌`;
    } else if (cardCount > 14) {
        statusAlert.classList.add('alert-error');
        statusAlert.textContent = `大相公！多了 ${cardCount - 14} 张牌`;
    }
    
    return true;
}

// 分析手牌
function analyzeHand() {
    const resultArea = document.getElementById('result-area');
    const cardCount = selectedCards.length;
    
    // 检查相公状态
    if (checkXianggong()) {
        resultArea.innerHTML = '<p class="text-red-600">手牌数量不正确，无法分析胡牌/听牌状态！</p>';
        hideFanDetails();
        return;
    }
    
    // 检查四川麻将定缺规则
    if (currentRule === 'sichuan' && lackType !== 'none') {
        const lackCards = selectedCards.filter(card => {
            if (lackType === 'wan') return card.includes('万');
            if (lackType === 'tiao') return card.includes('条');
            if (lackType === 'tong') return card.includes('筒');
            return false;
        });
        
        if (lackCards.length > 0) {
            showStatus('违反定缺规则！不能有' + lackType + '子牌', 'error');
            resultArea.innerHTML = `<p class="text-red-600">违反定缺规则！手牌中包含${lackType}子牌，不符合四川麻将规则</p>`;
            hideFanDetails();
            return;
        }
    }
    
    // 整理手牌数据
    const cardGroups = organizeCards(selectedCards);
    
    // 判断胡牌状态
    let isHu = false;
    let fanInfo = { total: 0, details: [] };
    let tingCards = [];
    
    if (cardCount === 14) {
        // 14张牌，判断是否胡牌
        isHu = checkHu(cardGroups);
        if (isHu) {
            fanInfo = calculateFan(cardGroups);
            showFanDetails(fanInfo.details);
        } else {
            hideFanDetails();
        }
    } else if (cardCount === 13) {
        // 13张牌，判断听牌
        tingCards = checkTing(cardGroups);
        hideFanDetails();
    }
    
    // 显示结果
    displayResult(isHu, fanInfo, tingCards, cardCount);
}

// 整理手牌为便于计算的格式
function organizeCards(cards) {
    const groups = {
        wanzi: Array(9).fill(0),
        tiaozi: Array(9).fill(0),
        tongzi: Array(9).fill(0),
        zapai: Array(7).fill(0),
        total: {
            wanzi: 0,
            tiaozi: 0,
            tongzi: 0,
            zapai: 0
        }
    };
    
    const zapaiMap = {
        '东': 0, '南': 1, '西': 2, '北': 3, '中': 4, '发': 5, '白': 6
    };
    
    cards.forEach(card => {
        if (card.includes('万')) {
            const num = parseInt(card) - 1;
            groups.wanzi[num]++;
            groups.total.wanzi++;
        } else if (card.includes('条')) {
            const num = parseInt(card) - 1;
            groups.tiaozi[num]++;
            groups.total.tiaozi++;
        } else if (card.includes('筒')) {
            const num = parseInt(card) - 1;
            groups.tongzi[num]++;
            groups.total.tongzi++;
        } else if (zapaiMap[card] !== undefined) {
            groups.zapai[zapaiMap[card]]++;
            groups.total.zapai++;
        }
    });
    
    return groups;
}

// 判断是否胡牌（核心算法，包含七对判断）
function checkHu(cardGroups) {
    // 先检查是否是七对
    if (checkQiDui(cardGroups)) {
        return true;
    }
    
    // 复制一份数据，避免修改原数据
    const groups = JSON.parse(JSON.stringify(cardGroups));
    
    // 尝试以每一张字牌或序数牌作为将牌（对子）
    // 遍历万条筒
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (groups[type][i] >= 2) {
                // 假设这张牌作为将牌
                const tempGroups = JSON.parse(JSON.stringify(groups));
                tempGroups[type][i] -= 2;
                
                // 检查剩下的牌是否都能组成刻子或顺子
                if (checkAllGroups(tempGroups)) {
                    return true;
                }
            }
        }
    }
    
    // 遍历字牌
    for (let i = 0; i < 7; i++) {
        if (groups.zapai[i] >= 2) {
            const tempGroups = JSON.parse(JSON.stringify(groups));
            tempGroups.zapai[i] -= 2;
            
            if (checkAllGroups(tempGroups)) {
                return true;
            }
        }
    }
    
    return false;
}

// 检查是否是七对/龙七对
function checkQiDui(cardGroups) {
    let pairCount = 0;
    let hasFour = false;
    
    // 检查万条筒
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            const count = cardGroups[type][i];
            if (count === 2) {
                pairCount++;
            } else if (count === 4) {
                pairCount += 2; // 四张算两对
                hasFour = true;
            } else if (count !== 0) {
                return false; // 不是2或4张，不符合七对
            }
        }
    }
    
    // 检查字牌
    for (let i = 0; i < 7; i++) {
        const count = cardGroups.zapai[i];
        if (count === 2) {
            pairCount++;
        } else if (count === 4) {
            pairCount += 2;
            hasFour = true;
        } else if (count !== 0) {
            return false;
        }
    }
    
    // 七对需要正好7对
    if (pairCount === 7) {
        // 龙七对需要有四张相同的牌
        window.isLongQiDui = hasFour;
        return true;
    }
    
    return false;
}

// 检查所有牌是否能组成刻子/顺子
function checkAllGroups(groups) {
    // 检查万条筒
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        const nums = groups[type];
        for (let i = 0; i < 9; i++) {
            if (nums[i] === 0) continue;
            
            // 优先检查刻子
            if (nums[i] >= 3) {
                nums[i] -= 3;
                i--; // 重新检查当前位置
            } 
            // 检查顺子
            else if (i <= 6 && nums[i] >= 1 && nums[i+1] >= 1 && nums[i+2] >= 1) {
                nums[i]--;
                nums[i+1]--;
                nums[i+2]--;
                i--; // 重新检查当前位置
            } 
            // 无法组成刻子或顺子
            else {
                return false;
            }
        }
    }
    
    // 检查字牌（只能组成刻子）
    for (let i = 0; i < 7; i++) {
        if (groups.zapai[i] === 0) continue;
        
        if (groups.zapai[i] === 3) {
            groups.zapai[i] -= 3;
        } else {
            return false;
        }
    }
    
    // 所有牌都能组成有效组合
    return true;
}

// 计算番数（扩展版）
function calculateFan(cardGroups) {
    const fanDetails = [];
    let totalFan = 0;
    const rules = fanDefinitions[currentRule];
    
    // 检查是否是七对
    if (window.isLongQiDui) {
        fanDetails.push({
            name: rules.longqidui.name,
            fan: rules.longqidui.fan,
            type: rules.longqidui.type
        });
        totalFan += rules.longqidui.fan;
    } else if (checkQiDui(cardGroups)) {
        fanDetails.push({
            name: rules.qidui.name,
            fan: rules.qidui.fan,
            type: rules.qidui.type
        });
        totalFan += rules.qidui.fan;
    } else {
        // 普通胡牌番型计算
        // 平胡
        fanDetails.push({
            name: rules.pinghu.name,
            fan: rules.pinghu.fan,
            type: rules.pinghu.type
        });
        totalFan += rules.pinghu.fan;
        
        // 碰碰胡
        if (isPengPengHu(cardGroups)) {
            fanDetails.push({
                name: rules.pengpenghu.name,
                fan: rules.pengpenghu.fan,
                type: rules.pengpenghu.type
            });
            totalFan += rules.pengpenghu.fan;
        }
        
        // 清一色
        if (isQingYiSe(cardGroups)) {
            fanDetails.push({
                name: rules.qingyise.name,
                fan: rules.qingyise.fan,
                type: rules.qingyise.type
            });
            totalFan += rules.qingyise.fan;
        }
        // 混一色（不是清一色但有字牌）
        else if (isHunYiSe(cardGroups)) {
            fanDetails.push({
                name: rules.hunyise.name,
                fan: rules.hunyise.fan,
                type: rules.hunyise.type
            });
            totalFan += rules.hunyise.fan;
        }
    }
    
    // 特殊牌型番数
    if (specialFlags.gangshanghua && rules.gangshanghua) {
        fanDetails.push({
            name: rules.gangshanghua.name,
            fan: rules.gangshanghua.fan,
            type: rules.gangshanghua.type
        });
        totalFan += rules.gangshanghua.fan;
    }
    
    if (specialFlags.haidilaoyue && rules.haidilaoyue) {
        fanDetails.push({
            name: rules.haidilaoyue.name,
            fan: rules.haidilaoyue.fan,
            type: rules.haidilaoyue.type
        });
        totalFan += rules.haidilaoyue.fan;
    }
    
    // 国标麻将特殊番型
    if (currentRule === 'national' && isYiTiaoLong(cardGroups)) {
        fanDetails.push({
            name: rules.yitiaolong.name,
            fan: rules.yitiaolong.fan,
            type: rules.yitiaolong.type
        });
        totalFan += rules.yitiaolong.fan;
    }
    
    // 广东麻将特殊番型
    if (currentRule === 'guangdong') {
        fanDetails.push({
            name: rules.zimo.name,
            fan: rules.zimo.fan,
            type: rules.zimo.type
        });
        totalFan += rules.zimo.fan;
    }
    
    return {
        total: totalFan,
        details: fanDetails
    };
}

// 判断碰碰胡
function isPengPengHu(groups) {
    // 碰碰胡：所有牌都是刻子+将牌
    let total = 0;
    
    // 检查万条筒
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        const nums = groups[type];
        for (let i = 0; i < 9; i++) {
            if (nums[i] !== 0 && nums[i] !== 3) {
                return false;
            }
            total += nums[i];
        }
    }
    
    // 检查字牌
    for (let i = 0; i < 7; i++) {
        if (groups.zapai[i] !== 0 && groups.zapai[i] !== 3) {
            return false;
        }
        total += groups.zapai[i];
    }
    
    // 总牌数应该是12（4个刻子），因为将牌已经被扣除
    return total === 12;
}

// 判断清一色
function isQingYiSe(groups) {
    // 只有万/条/筒中的一种，无字牌
    const wanCount = groups.total.wanzi;
    const tiaoCount = groups.total.tiaozi;
    const tongCount = groups.total.tongzi;
    const zaCount = groups.total.zapai;
    
    // 字牌必须为0，且只有一种序数牌
    return zaCount === 0 && 
           ((wanCount > 0 && tiaoCount === 0 && tongCount === 0) ||
            (tiaoCount > 0 && wanCount === 0 && tongCount === 0) ||
            (tongCount > 0 && wanCount === 0 && tiaoCount === 0));
}

// 判断混一色
function isHunYiSe(groups) {
    // 有且只有一种序数牌 + 字牌
    const wanCount = groups.total.wanzi;
    const tiaoCount = groups.total.tiaozi;
    const tongCount = groups.total.tongzi;
    const zaCount = groups.total.zapai;
    
    // 必须有字牌
    if (zaCount === 0) return false;
    
    // 只能有一种序数牌
    const suitCount = [wanCount > 0, tiaoCount > 0, tongCount > 0].filter(Boolean).length;
    return suitCount === 1;
}

// 判断一条龙（国标麻将）
function isYiTiaoLong(groups) {
    // 检查是否有1-9的完整序列
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        if (groups[type].every(count => count > 0)) {
            return true;
        }
    }
    return false;
}

// 检查听牌
function checkTing(cardGroups) {
    const tingCards = [];
    const allCards = [
        ...cardTypes.wanzi,
        ...cardTypes.tiaozi,
        ...cardTypes.tongzi,
        ...cardTypes.zapai
    ];
    
    // 尝试添加每一种牌，看是否能胡
    allCards.forEach(card => {
        // 跳过定缺的牌（四川麻将）
        if (currentRule === 'sichuan' && lackType !== 'none') {
            if ((lackType === 'wan' && card.includes('万')) ||
                (lackType === 'tiao' && card.includes('条')) ||
                (lackType === 'tong' && card.includes('筒'))) {
                return;
            }
        }
        
        // 检查当前牌是否已经有4张
        const currentCount = selectedCards.filter(c => c === card).length;
        if (currentCount >= 4) return;
        
        // 模拟添加这张牌
        const tempSelected = [...selectedCards, card];
        const tempGroups = organizeCards(tempSelected);
        
        // 检查是否胡牌
        if (checkHu(tempGroups)) {
            tingCards.push(card);
        }
    });
    
    return tingCards;
}

// 显示分析结果
function displayResult(isHu, fanInfo, tingCards, cardCount) {
    const resultArea = document.getElementById('result-area');
    let html = '';
    
    if (cardCount === 14) {
        if (isHu) {
            html = `
                <div class="text-green-600 font-medium mb-2">恭喜！您的手牌已经胡牌🎉</div>
                <div>总番数：<span class="font-bold text-xl">${fanInfo.total}</span> 番</div>
                <div class="mt-2 text-sm text-gray-500">
                    当前规则：${currentRule === 'national' ? '国标麻将' : 
                             currentRule === 'sichuan' ? '四川麻将' : '广东麻将'}
                </div>
            `;
            showStatus('胡牌成功！', 'success');
        } else {
            html = '<div class="text-red-600">未胡牌，请检查手牌组合</div>';
            showStatus('未胡牌', 'info');
        }
    } else if (cardCount === 13) {
        if (tingCards.length > 0) {
            html = `
                <div class="text-blue-600 font-medium mb-2">听牌！</div>
                <div>可胡牌：<span class="font-bold">${tingCards.join('、')}</span></div>
                <div class="mt-2 text-sm text-gray-500">
                    当前规则：${currentRule === 'national' ? '国标麻将' : 
                             currentRule === 'sichuan' ? '四川麻将' : '广东麻将'}
                </div>
            `;
            showStatus(`听${tingCards.length}张牌`, 'info');
        } else {
            html = '<div class="text-red-600">未听牌，请调整手牌</div>';
            showStatus('未听牌', 'warning');
        }
    }
    
    resultArea.innerHTML = html;
}

// 显示番型详情
function showFanDetails(fanDetails) {
    const fanDetailsEl = document.getElementById('fan-details');
    const fanListEl = document.getElementById('fan-list');
    
    fanListEl.innerHTML = '';
    fanDetails.forEach(item => {
        const li = document.createElement('li');
        li.className = item.type + '-fan';
        li.textContent = `${item.name}：${item.fan}番`;
        fanListEl.appendChild(li);
    });
    
    fanDetailsEl.classList.remove('hidden');
}

// 隐藏番型详情
function hideFanDetails() {
    document.getElementById('fan-details').classList.add('hidden');
}

// 重置手牌
function resetHand() {
    // 清空选中的牌
    selectedCards = [];
    
    // 移除所有选中样式
    document.querySelectorAll('.ma-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 清空结果和状态
    document.getElementById('result-area').textContent = '请选择手牌后点击"分析手牌"按钮';
    document.getElementById('status-alert').classList.add('hidden');
    hideFanDetails();
    
    // 重置特殊标记
    window.isLongQiDui = false;
    document.getElementById('gangshanghua').checked = false;
    document.getElementById('haidilaoyue').checked = false;
    specialFlags = {
        gangshanghua: false,
        haidilaoyue: false
    };
}

// 显示状态提示
function showStatus(message, type) {
    const alert = document.getElementById('status-alert');
    alert.textContent = message;
    alert.classList.remove('hidden', 'alert-success', 'alert-error', 'alert-warning', 'alert-info');
    
    switch(type) {
        case 'success':
            alert.classList.add('alert-success');
            break;
        case 'error':
            alert.classList.add('alert-error');
            break;
        case 'warning':
            alert.classList.add('alert-warning');
            break;
        case 'info':
            alert.classList.add('alert-info');
            break;
    }
}
