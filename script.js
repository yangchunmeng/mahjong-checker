// 麻将牌定义
const cardTypes = {
    wanzi: ['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万'],
    tiaozi: ['1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条'],
    tongzi: ['1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒'],
    zapai: ['东', '南', '西', '北', '中', '发', '白']
};

// 番型定义
const fanDefinitions = {
    national: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 4, type: 'medium' },
        qingyise: { name: '清一色', fan: 6, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 4, type: 'medium' },
        longqidui: { name: '龙七对', fan: 8, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 8, type: 'high' },
        haidilaoyue: { name: '海底捞月', fan: 8, type: 'high' }
    },
    sichuan: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 2, type: 'medium' },
        qingyise: { name: '清一色', fan: 4, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 4, type: 'high' },
        longqidui: { name: '龙七对', fan: 8, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 1, type: 'medium' },
        haidilaoyue: { name: '海底捞月', fan: 1, type: 'medium' }
    },
    guangdong: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 3, type: 'medium' },
        qingyise: { name: '清一色', fan: 5, type: 'high' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qidui: { name: '七对', fan: 5, type: 'high' },
        longqidui: { name: '龙七对', fan: 10, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 2, type: 'medium' },
        haidilaoyue: { name: '海底捞月', fan: 2, type: 'medium' }
    }
};

// 全局变量
let handCards = {}; // 手牌计数 { '1万': 2, ... }
let currentRule = 'national';
let specialFlags = { gangshanghua: false, haidilaoyue: false };
let lackType = 'none';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initHandCards();
    generateCardLibrary();
    bindEvents();
    updateRuleUI();
});

// 初始化手牌计数
function initHandCards() {
    handCards = {};
    for (const [type, cards] of Object.entries(cardTypes)) {
        cards.forEach(card => handCards[card] = 0);
    }
    updateHandCardDisplay();
}

// 生成牌库
function generateCardLibrary() {
    for (const [type, cards] of Object.entries(cardTypes)) {
        const container = document.getElementById(`${type}-container`);
        cards.forEach(card => {
            const cardEl = createCardElement(card, type);
            container.appendChild(cardEl);
        });
    }
}

// 创建麻将牌元素（极简样式）
function createCardElement(card, type) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ma-card';
    cardEl.dataset.card = card;
    cardEl.textContent = card;

    // 点击添加手牌（最多4张）
    cardEl.addEventListener('click', () => {
        if (handCards[card] >= 4) {
            showToast(`【${card}】最多4张`);
            return;
        }
        if (isLackCard(card)) return;
        
        handCards[card]++;
        updateCardLibraryDisplay();
        updateHandCardDisplay();
    });

    return cardEl;
}

// 绑定事件
function bindEvents() {
    // 规则切换
    document.getElementById('rule-selector').addEventListener('change', (e) => {
        currentRule = e.target.value;
        updateRuleUI();
    });

    // 定缺切换
    document.getElementById('lack-selector').addEventListener('change', (e) => {
        lackType = e.target.value;
        updateLackCards();
        updateHandCardDisplay();
    });

    // 特殊牌型复选框
    document.getElementById('gangshanghua').addEventListener('change', (e) => {
        specialFlags.gangshanghua = e.target.checked;
    });
    document.getElementById('haidilaoyue').addEventListener('change', (e) => {
        specialFlags.haidilaoyue = e.target.checked;
    });

    // 重置手牌
    document.getElementById('reset-btn').addEventListener('click', initHandCards);

    // 分析手牌
    document.getElementById('analyze-btn').addEventListener('click', analyzeHand);

    // 手动排序按钮
    document.getElementById('sort-hand-btn').addEventListener('click', () => {
        updateHandCardDisplay(true); // 强制重新排序
    });
}

// 更新规则UI
function updateRuleUI() {
    const sichuanOptions = document.getElementById('sichuan-options');
    const zapaiSection = document.getElementById('zapai-section');
    
    if (currentRule === 'sichuan') {
        sichuanOptions.classList.remove('hidden');
        zapaiSection.classList.add('hidden');
    } else {
        sichuanOptions.classList.add('hidden');
        zapaiSection.classList.remove('hidden');
    }
    updateLackCards();
}

// 更新定缺牌禁用状态
function updateLackCards() {
    document.querySelectorAll('.ma-card.disabled').forEach(el => el.classList.remove('disabled'));
    if (currentRule !== 'sichuan' || lackType === 'none') return;

    // 禁用定缺牌
    const containerId = `${lackType}zi-container`;
    document.querySelectorAll(`#${containerId} .ma-card`).forEach(el => {
        el.classList.add('disabled');
        const card = el.dataset.card;
        handCards[card] = 0; // 清空定缺牌
    });
}

// 判断是否是定缺牌
function isLackCard(card) {
    if (currentRule !== 'sichuan' || lackType === 'none') return false;
    return (lackType === 'wan' && card.includes('万')) ||
           (lackType === 'tiao' && card.includes('条')) ||
           (lackType === 'tong' && card.includes('筒'));
}

// 更新牌库牌的数量显示
function updateCardLibraryDisplay() {
    document.querySelectorAll('.ma-card').forEach(el => {
        const card = el.dataset.card;
        const count = handCards[card];
        
        // 移除旧徽章
        const oldBadge = el.querySelector('.count-badge');
        if (oldBadge) oldBadge.remove();

        // 添加数量徽章
        if (count > 0) {
            const badge = document.createElement('div');
            badge.className = 'count-badge';
            badge.textContent = count;
            el.appendChild(badge);
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

// 手牌排序核心函数
function sortHandCards(cardsArray) {
    // 排序规则：万→条→筒→字牌，数字升序，字牌固定顺序
    const cardOrder = {
        // 序数牌
        '1万': 1, '2万': 2, '3万': 3, '4万': 4, '5万': 5, '6万': 6, '7万': 7, '8万': 8, '9万': 9,
        '1条': 10, '2条': 11, '3条': 12, '4条': 13, '5条': 14, '6条': 15, '7条': 16, '8条': 17, '9条': 18,
        '1筒': 19, '2筒': 20, '3筒': 21, '4筒': 22, '5筒': 23, '6筒': 24, '7筒': 25, '8筒': 26, '9筒': 27,
        // 字牌
        '东': 28, '南': 29, '西': 30, '北': 31, '中': 32, '发': 33, '白': 34
    };

    return cardsArray.sort((a, b) => {
        return cardOrder[a] - cardOrder[b];
    });
}

// 更新手牌展示区（含自动排序）
function updateHandCardDisplay(forceSort = false) {
    const display = document.getElementById('hand-card-display');
    const countEl = document.getElementById('card-count');
    let cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;

    display.innerHTML = '';
    if (totalCount === 0) {
        display.innerHTML = '<p class="text-gray-500">暂无手牌，请从牌库选择</p>';
        countEl.textContent = '0';
        return;
    }

    // 自动排序手牌
    cardsArray = sortHandCards(cardsArray);
    
    // 去重获取唯一牌
    const uniqueCards = [...new Set(cardsArray)];
    
    // 生成手牌展示元素
    uniqueCards.forEach(card => {
        const count = handCards[card];
        const cardEl = createCardElement(card, getCardType(card));
        cardEl.classList.add('hand-card');
        cardEl.style.cursor = 'default';
        
        // 添加删除按钮
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => {
            handCards[card]--;
            updateCardLibraryDisplay();
            updateHandCardDisplay();
        });
        cardEl.appendChild(delBtn);

        // 添加数量（大于1时显示）
        if (count > 1) {
            const badge = document.createElement('div');
            badge.className = 'count-badge';
            badge.textContent = count;
            cardEl.appendChild(badge);
        }

        display.appendChild(cardEl);
    });

    countEl.textContent = totalCount;
}

// 获取手牌数组
function getHandCardsArray() {
    const arr = [];
    for (const [card, count] of Object.entries(handCards)) {
        for (let i = 0; i < count; i++) arr.push(card);
    }
    return arr;
}

// 获取牌型
function getCardType(card) {
    if (card.includes('万')) return 'wanzi';
    if (card.includes('条')) return 'tiaozi';
    if (card.includes('筒')) return 'tongzi';
    return 'zapai';
}

// 分析手牌核心逻辑
function analyzeHand() {
    const resultArea = document.getElementById('result-area');
    const recommendArea = document.getElementById('discard-recommend');
    const patternArea = document.getElementById('hu-pattern-display');
    const cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;
    
    // 重置显示
    recommendArea.classList.add('hidden');
    patternArea.classList.add('hidden');

    if (totalCount === 0) {
        resultArea.innerHTML = '<p class="text-red-500">请先选择手牌</p>';
        return;
    }

    const cardGroups = organizeCards(cardsArray);
    let resultHtml = '';

    // 判断是否胡牌
    if (isHu(cardGroups, totalCount)) {
        const fanInfo = calculateFan(cardGroups);
        // 分析胡牌牌型结构
        const huPattern = analyzeHuPattern(cardGroups, cardsArray);
        
        resultHtml = `
            <div class="text-green-600 font-medium mb-2">恭喜！当前手牌已胡牌 🎉</div>
            <div>总番数：<span class="font-bold text-xl">${fanInfo.total}</span> 番</div>
            <div id="fan-details" class="mt-2">
                ${fanInfo.details.map(item => `<span class="fan-item ${item.type}-fan">${item.name}(${item.fan}番)</span>`).join('')}
            </div>
            <div class="mt-2 text-sm text-gray-500">当前规则：${getRuleName()}</div>
        `;
        
        // 生成胡牌牌型图示
        generateHuPatternDisplay(huPattern);
        patternArea.classList.remove('hidden');
    } else {
        // 判断听牌 + 弃牌推荐
        const tingInfo = checkTingAll(cardsArray);
        if (tingInfo.tingCards.length > 0) {
            resultHtml = `
                <div class="text-blue-600 font-medium mb-2">听牌！</div>
                <div>可胡牌：<span class="font-bold">${tingInfo.tingCards.join('、')}</span></div>
                <div class="mt-2 text-sm text-gray-500">当前规则：${getRuleName()}</div>
            `;
        } else {
            // 未听牌，推荐弃牌（优化版）
            const recommendList = getDiscardRecommend(cardsArray);
            resultHtml = `
                <div class="text-orange-600 font-medium mb-2">未听牌</div>
                <div>推荐以下弃牌策略：</div>
            `;
            showOptimizedRecommend(recommendList); // 使用优化后的推荐展示
            recommendArea.classList.remove('hidden');
        }
    }

    resultArea.innerHTML = resultHtml;
}

// 分析胡牌牌型结构
function analyzeHuPattern(cardGroups, cardsArray) {
    // 七对特殊处理
    if (checkQiDui(cardGroups)) {
        const pairs = [];
        // 遍历所有牌找对子
        for (const [type, cards] of Object.entries(cardTypes)) {
            cards.forEach(card => {
                const count = handCards[card];
                if (count >= 2) {
                    // 四张算两对
                    const pairCount = Math.floor(count / 2);
                    for (let i = 0; i < pairCount; i++) {
                        pairs.push({
                            type: 'pair',
                            cards: [card, card]
                        });
                    }
                }
            });
        }
        return {
            type: 'qidui',
            jiang: null,
            groups: pairs
        };
    }

    // 普通胡牌分析
    const pattern = {
        jiang: null,
        groups: []
    };

    // 复制手牌数据
    const tempGroups = JSON.parse(JSON.stringify(cardGroups));
    let foundJiang = false;

    // 寻找将牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (tempGroups[type][i] >= 2) {
                // 标记将牌
                const cardName = getCardNameByIndex(type, i);
                pattern.jiang = {
                    type: 'jiang',
                    cards: [cardName, cardName]
                };
                
                tempGroups[type][i] -= 2;
                foundJiang = true;
                break;
            }
        }
        if (foundJiang) break;
    }

    // 分析刻子/顺子
    // 先分析字牌刻子
    for (let i = 0; i < 7; i++) {
        if (tempGroups.zapai[i] === 3) {
            const cardName = getCardNameByIndex('zapai', i);
            pattern.groups.push({
                type: 'ke',
                cards: [cardName, cardName, cardName]
            });
            tempGroups.zapai[i] = 0;
        }
    }

    // 分析序数牌刻子/顺子
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (tempGroups[type][i] === 0) continue;
            
            // 优先分析刻子
            if (tempGroups[type][i] === 3) {
                const cardName = getCardNameByIndex(type, i);
                pattern.groups.push({
                    type: 'ke',
                    cards: [cardName, cardName, cardName]
                });
                tempGroups[type][i] = 0;
            }
            // 分析顺子
            else if (i <= 6 && tempGroups[type][i] >= 1 && tempGroups[type][i+1] >= 1 && tempGroups[type][i+2] >= 1) {
                const card1 = getCardNameByIndex(type, i);
                const card2 = getCardNameByIndex(type, i+1);
                const card3 = getCardNameByIndex(type, i+2);
                pattern.groups.push({
                    type: 'shun',
                    cards: [card1, card2, card3]
                });
                tempGroups[type][i]--;
                tempGroups[type][i+1]--;
                tempGroups[type][i+2]--;
                i--; // 重新检查当前位置
            }
        }
    }

    return pattern;
}

// 根据索引获取牌名
function getCardNameByIndex(type, index) {
    if (type === 'wanzi') return `${index + 1}万`;
    if (type === 'tiaozi') return `${index + 1}条`;
    if (type === 'tongzi') return `${index + 1}筒`;
    if (type === 'zapai') return ['东', '南', '西', '北', '中', '发', '白'][index];
    return '';
}

// 生成胡牌牌型图示
function generateHuPatternDisplay(pattern) {
    const container = document.getElementById('pattern-container');
    container.innerHTML = '';

    // 七对展示
    if (pattern.type === 'qidui') {
        const title = document.createElement('div');
        title.className = 'text-center font-medium mb-3';
        title.textContent = window.isLongQiDui ? '龙七对牌型' : '七对牌型';
        container.appendChild(title);

        const pairsContainer = document.createElement('div');
        pairsContainer.className = 'flex flex-wrap justify-center gap-2';
        
        pattern.groups.forEach((pair, idx) => {
            const pairGroup = createPatternGroup('对子', pair.cards, 'jiang-group');
            pairsContainer.appendChild(pairGroup);
        });
        
        container.appendChild(pairsContainer);
        return;
    }

    // 普通胡牌展示
    // 显示将牌
    if (pattern.jiang) {
        const jiangGroup = createPatternGroup('将牌', pattern.jiang.cards, 'jiang-group');
        container.appendChild(jiangGroup);
    }

    // 显示刻子/顺子
    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'flex flex-wrap justify-center gap-2';
    
    pattern.groups.forEach((group, idx) => {
        const groupName = group.type === 'ke' ? '刻子' : '顺子';
        const groupClass = group.type === 'ke' ? 'ke-group' : 'shun-group';
        const patternGroup = createPatternGroup(groupName, group.cards, groupClass);
        groupsContainer.appendChild(patternGroup);
    });
    
    container.appendChild(groupsContainer);
}

// 创建牌型组元素
function createPatternGroup(title, cards, className) {
    const group = document.createElement('div');
    group.className = `pattern-group ${className}`;
    
    // 标题
    const titleEl = document.createElement('div');
    titleEl.className = 'pattern-title';
    titleEl.textContent = title;
    group.appendChild(titleEl);
    
    // 牌组
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'pattern-cards';
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'pattern-card';
        cardEl.textContent = card;
        cardsContainer.appendChild(cardEl);
    });
    
    group.appendChild(cardsContainer);
    return group;
}

// 整理手牌数据
function organizeCards(cards) {
    const groups = {
        wanzi: Array(9).fill(0),
        tiaozi: Array(9).fill(0),
        tongzi: Array(9).fill(0),
        zapai: Array(7).fill(0),
        total: { wanzi: 0, tiaozi: 0, tongzi: 0, zapai: 0 }
    };
    const zapaiMap = { '东':0,'南':1,'西':2,'北':3,'中':4,'发':5,'白':6 };

    cards.forEach(card => {
        if (card.includes('万')) {
            const idx = parseInt(card) - 1;
            groups.wanzi[idx]++;
            groups.total.wanzi++;
        } else if (card.includes('条')) {
            const idx = parseInt(card) - 1;
            groups.tiaozi[idx]++;
            groups.total.tiaozi++;
        } else if (card.includes('筒')) {
            const idx = parseInt(card) - 1;
            groups.tongzi[idx]++;
            groupsongzi[idx]++;
            groups.total.tongzi++;
        } else {
            const idx = zapaiMap[card];
            groups.zapai[idx]++;
            groups.total.zapai++;
        }
    });
    return groups;
}

// 判断胡牌
function isHu(cardGroups, totalCount) {
    // 七对判断
    if (checkQiDui(cardGroups)) return true;

    // 普通胡牌：n张牌需要满足 (n-2) 是3的倍数
    if ((totalCount - 2) % 3 !== 0) return false;

    const groups = JSON.parse(JSON.stringify(cardGroups));
    // 遍历所有可能的将牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (groups[type][i] < 2) continue;
            const tempGroups = JSON.parse(JSON.stringify(groups));
            tempGroups[type][i] -= 2;
            if (checkAllGroups(tempGroups)) return true;
        }
    }
    return false;
}

// 检查七对/龙七对
function checkQiDui(cardGroups) {
    let pairCount = 0;
    window.isLongQiDui = false;
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            const count = cardGroups[type][i];
            if (count === 2) pairCount++;
            else if (count === 4) { pairCount += 2; window.isLongQiDui = true; }
            else if (count !== 0) return false;
        }
    }
    return pairCount === 7;
}

// 检查刻子/顺子
function checkAllGroups(groups) {
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        const nums = groups[type];
        for (let i = 0; i < 9; i++) {
            if (nums[i] === 0) continue;
            if (nums[i] >= 3) nums[i] -= 3;
            else if (i <= 6 && nums[i] >= 1 && nums[i+1] >=1 && nums[i+2] >=1) {
                nums[i]--; nums[i+1]--; nums[i+2]--;
            } else return false;
            i--; // 重新检查当前位置
        }
    }
    // 字牌只能是刻子
    for (let i = 0; i < 7; i++) {
        if (groups.zapai[i] !== 0 && groups.zapai[i] !== 3) return false;
    }
    return true;
}

// 计算番数
function calculateFan(cardGroups) {
    const rules = fanDefinitions[currentRule];
    const details = [];
    let total = 0;

    if (window.isLongQiDui) {
        details.push(rules.longqidui);
