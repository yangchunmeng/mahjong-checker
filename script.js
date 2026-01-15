const cardTypes = {
    wanzi: ['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万'],
    tiaozi: ['1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条'],
    tongzi: ['1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒'],
    zapai: ['东', '南', '西', '北', '中', '发', '白']
};

// 新增：获取麻将牌对应的图标和样式类
function getMahjongIcon(card) {
    let iconClass = '';
    let typeClass = '';
    const cardText = card.replace(/[0-9]/, ''); // 提取牌型（万/条/筒/字）
    
    // 万子（饼图图标）
    if (card.includes('万')) {
        iconClass = 'fas fa-circle-dot';
        typeClass = 'wan-icon';
    }
    // 条子（竹节/数字图标）
    else if (card.includes('条')) {
        iconClass = 'fas fa-bamboo';
        typeClass = 'tiao-icon';
    }
    // 筒子（方块图标）
    else if (card.includes('筒')) {
        iconClass = 'fas fa-square';
        typeClass = 'tong-icon';
    }
    // 字牌（方向/文字图标）
    else {
        switch (card) {
            case '东': iconClass = 'fas fa-arrow-right'; break;
            case '南': iconClass = 'fas fa-arrow-down'; break;
            case '西': iconClass = 'fas fa-arrow-left'; break;
            case '北': iconClass = 'fas fa-arrow-up'; break;
            case '中': iconClass = 'fas fa-circle'; break;
            case '发': iconClass = 'fas fa-money-bill-wave'; break;
            case '白': iconClass = 'fas fa-square-full'; break;
            default: iconClass = 'fas fa-circle';
        }
        typeClass = 'zi-icon';
    }
    return { iconClass, typeClass, cardText };
}

const fanDefinitions = {
    national: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        duanyaojiu: { name: '断幺九', fan: 1, type: 'base' },
        yaojiuke: { name: '幺九刻', fan: 1, type: 'base' },
        menqing: { name: '门清', fan: 1, type: 'base' },
        pinghe: { name: '平和', fan: 2, type: 'base' },
        minggang: { name: '明杠', fan: 1, type: 'base' },
        angang: { name: '暗杠', fan: 2, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 6, type: 'medium' },
        hunyise: { name: '混一色', fan: 6, type: 'medium' },
        qingyise: { name: '清一色', fan: 24, type: 'high' },
        qidui: { name: '七对', fan: 6, type: 'medium' },
        longqidui: { name: '龙七对', fan: 16, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 8, type: 'special' },
        haidilaoyue: { name: '海底捞月', fan: 8, type: 'special' }
    },
    sichuan: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        duanyaojiu: { name: '断幺九', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 2, type: 'medium' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qingyise: { name: '清一色', fan: 4, type: 'high' },
        qidui: { name: '七对', fan: 4, type: 'high' },
        longqidui: { name: '龙七对', fan: 8, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 1, type: 'special' },
        haidilaoyue: { name: '海底捞月', fan: 1, type: 'special' }
    },
    guangdong: {
        pinghu: { name: '平胡', fan: 1, type: 'base' },
        duanyaojiu: { name: '断幺九', fan: 1, type: 'base' },
        pengpenghu: { name: '碰碰胡', fan: 3, type: 'medium' },
        hunyise: { name: '混一色', fan: 2, type: 'medium' },
        qingyise: { name: '清一色', fan: 5, type: 'high' },
        qidui: { name: '七对', fan: 5, type: 'high' },
        longqidui: { name: '龙七对', fan: 10, type: 'high' },
        gangshanghua: { name: '杠上花', fan: 2, type: 'special' },
        haidilaoyue: { name: '海底捞月', fan: 2, type: 'special' },
        zimojia: { name: '自摸', fan: 1, type: 'base' }
    }
};

// 全局变量（底分默认5）
let handCards = {};
let currentRule = 'national';
let lackType = 'none';
let baseScore = 5; 

// 页面加载完成后初始化（核心：保证DOM加载完再生成牌）
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
    document.getElementById('base-score').disabled = true;
}

// 生成牌库（核心修复：容器校验+清空重绘，保证牌显示）
function generateCardLibrary() {
    for (const [type, cards] of Object.entries(cardTypes)) {
        const container = document.getElementById(`${type}-container`);
        if (!container) continue; // 防止容器不存在报错
        container.innerHTML = ''; // 清空原有内容，避免重复生成
        cards.forEach(card => {
            const cardEl = createCardElement(card, type);
            container.appendChild(cardEl);
        });
    }
}

// 新增：创建带图标的牌面元素 + 手机触控反馈
function createCardElement(card, type) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ma-card';
    cardEl.dataset.card = card;
    
    // 获取麻将图标配置
    const { iconClass, typeClass, cardText } = getMahjongIcon(card);
    
    // 构建牌面结构（图标 + 文字）
    cardEl.innerHTML = `
        <i class="mahjong-icon ${iconClass} ${typeClass}"></i>
        <span class="mahjong-text">${card}</span>
    `;
    
    // 选牌逻辑
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

    // 苹果手机触控反馈
    cardEl.addEventListener('touchstart', () => cardEl.classList.add('active'));
    cardEl.addEventListener('touchend', () => cardEl.classList.remove('active'));
    cardEl.addEventListener('touchcancel', () => cardEl.classList.remove('active'));

    return cardEl;
}

// 绑定所有页面事件
function bindEvents() {
    // 规则切换
    document.getElementById('rule-selector').addEventListener('change', (e) => {
        currentRule = e.target.value;
        updateRuleUI();
    });

    // 四川麻约定缺切换
    document.getElementById('lack-selector').addEventListener('change', (e) => {
        lackType = e.target.value;
        updateLackCards();
        updateHandCardDisplay();
    });

    // 底分切换（实时重新计算）
    document.getElementById('base-score').addEventListener('change', (e) => {
        baseScore = parseInt(e.target.value);
        if (!document.getElementById('hu-pattern-display').classList.contains('hidden')) {
            const cardsArray = getHandCardsArray();
            const cardGroups = organizeCards(cardsArray);
            reCalculateScore(cardGroups);
        }
    });

    // 清空手牌
    document.getElementById('reset-btn').addEventListener('click', initHandCards);
    // 分析手牌
    document.getElementById('analyze-btn').addEventListener('click', analyzeHand);
    // 手动排序手牌
    document.getElementById('sort-hand-btn').addEventListener('click', () => {
        updateHandCardDisplay(true);
    });
}

// 重新计算胡牌得分（底分切换时调用）
function reCalculateScore(cardGroups) {
    const resultArea = document.getElementById('result-area');
    const fanInfo = calculateFan(cardGroups);
    const totalFan = fanInfo.baseTotal + fanInfo.specialTotal;
    const finalScore = baseScore * totalFan;
    
    let resultHtml = `
        <div class="text-green-600 font-medium mb-2">恭喜！当前手牌已胡牌 🎉</div>
        <div>总番数：<span class="font-bold text-xl">${totalFan}</span> 番 
            (基础${fanInfo.baseTotal}番 + 附加${fanInfo.specialTotal}番)
        </div>
        <div id="fan-details" class="mt-2">
            ${fanInfo.details.map(item => `<span class="fan-item ${item.type}-fan">${item.name}(${item.fan}番)</span>`).join('')}
        </div>
        <div class="score-result">
            底分：${baseScore} | 最终得分：<span class="final-score">${baseScore} × ${totalFan} = ${finalScore}</span>
        </div>
        <div class="mt-2 text-sm text-gray-500">当前规则：${getRuleName()}</div>
    `;
    resultArea.innerHTML = resultHtml;
}

// 更新规则对应的UI（显示/隐藏定缺/字牌）
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
    generateCardLibrary(); // 切换规则重新生成牌库，保证显示正常
}

// 更新定缺牌（置灰不可选）
function updateLackCards() {
    document.querySelectorAll('.ma-card.disabled').forEach(el => el.classList.remove('disabled'));
    if (currentRule !== 'sichuan' || lackType === 'none') return;

    const containerId = `${lackType}zi-container`;
    document.querySelectorAll(`#${containerId} .ma-card`).forEach(el => {
        el.classList.add('disabled');
        const card = el.dataset.card;
        handCards[card] = 0;
    });
}

// 判断是否为定缺牌
function isLackCard(card) {
    if (currentRule !== 'sichuan' || lackType === 'none') return false;
    return (lackType === 'wan' && card.includes('万')) ||
           (lackType === 'tiao' && card.includes('条')) ||
           (lackType === 'tong' && card.includes('筒'));
}

// 更新牌库显示（选中的牌显示数量徽章）
function updateCardLibraryDisplay() {
    document.querySelectorAll('.ma-card').forEach(el => {
        const card = el.dataset.card;
        const count = handCards[card] || 0;
        
        // 移除旧徽章
        const oldBadge = el.querySelector('.count-badge');
        if (oldBadge) oldBadge.remove();

        // 添加新徽章
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

// 手牌排序规则（万→条→筒→字，数字升序）
function sortHandCards(cardsArray) {
    const cardOrder = {
        '1万':1,'2万':2,'3万':3,'4万':4,'5万':5,'6万':6,'7万':7,'8万':8,'9万':9,
        '1条':10,'2条':11,'3条':12,'4条':13,'5条':14,'6条':15,'7条':16,'8条':17,'9条':18,
        '1筒':19,'2筒':20,'3筒':21,'4筒':22,'5筒':23,'6筒':24,'7筒':25,'8筒':26,'9筒':27,
        '东':28,'南':29,'西':30,'北':31,'中':32,'发':33,'白':34
    };

    return cardsArray.sort((a, b) => (cardOrder[a] || 99) - (cardOrder[b] || 99));
}

// 更新当前手牌显示
function updateHandCardDisplay(forceSort = false) {
    const display = document.getElementById('hand-card-display');
    const countEl = document.getElementById('card-count');
    let cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;

    display.innerHTML = '';
    // 无手牌时提示
    if (totalCount === 0) {
        display.innerHTML = '<p class="text-gray-500 text-sm">暂无手牌，请从牌库选择</p>';
        countEl.textContent = '0';
        return;
    }

    // 排序手牌
    cardsArray = sortHandCards(cardsArray);
    const uniqueCards = [...new Set(cardsArray)];
    
    // 生成手牌元素
    uniqueCards.forEach(card => {
        const count = handCards[card] || 0;
        const cardEl = document.createElement('div');
        cardEl.className = 'ma-card hand-card';
        cardEl.dataset.card = card;
        
        // 插入麻将图标
        const { iconClass, typeClass } = getMahjongIcon(card);
        cardEl.innerHTML = `
            <i class="mahjong-icon ${iconClass} ${typeClass}"></i>
            <span class="mahjong-text">${card}</span>
        `;
        
        cardEl.style.cursor = 'default';
        
        // 删除按钮（阻止冒泡，避免触发选牌）
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handCards[card]--;
            updateCardLibraryDisplay();
            updateHandCardDisplay();
        });
        cardEl.appendChild(delBtn);

        // 数量徽章
        if (count > 1) {
            const badge = document.createElement('div');
            badge.className = 'count-badge';
            badge.textContent = count;
            cardEl.appendChild(badge);
        }

        display.appendChild(cardEl);
    });

    // 更新手牌数量
    countEl.textContent = totalCount;
}

// 将手牌计数转为数组（方便后续分析）
function getHandCardsArray() {
    const arr = [];
    for (const [card, count] of Object.entries(handCards)) {
        for (let i = 0; i < (count || 0); i++) arr.push(card);
    }
    return arr;
}

// 获取牌的类型（万/条/筒/字）
function getCardType(card) {
    if (card.includes('万')) return 'wanzi';
    if (card.includes('条')) return 'tiaozi';
    if (card.includes('筒')) return 'tongzi';
    return 'zapai';
}

// 核心：分析手牌（胡/听/未听）
function analyzeHand() {
    const resultArea = document.getElementById('result-area');
    const recommendArea = document.getElementById('discard-recommend');
    const patternArea = document.getElementById('hu-pattern-display');
    const cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;
    const baseScoreEl = document.getElementById('base-score');
    
    // 隐藏推荐/牌型区
    recommendArea.classList.add('hidden');
    patternArea.classList.add('hidden');
    baseScoreEl.disabled = true;

    // 无手牌提示
    if (totalCount === 0) {
        resultArea.innerHTML = '<p class="text-red-500">请先选择手牌</p>';
        return;
    }

    const cardGroups = organizeCards(cardsArray);
    let resultHtml = '';

    // 胡牌逻辑
    if (isHu(cardGroups, totalCount)) {
        const fanInfo = calculateFan(cardGroups);
        const totalFan = fanInfo.baseTotal + fanInfo.specialTotal;
        const finalScore = baseScore * totalFan;
        const huPattern = analyzeHuPattern(cardGroups, cardsArray);
        
        // 启用底分选择
        baseScoreEl.disabled = false;
        baseScoreEl.value = baseScore;

        // 生成胡牌结果
        resultHtml = `
            <div class="text-green-600 font-medium mb-2">恭喜！当前手牌已胡牌 🎉</div>
            <div>总番数：<span class="font-bold text-xl">${totalFan}</span> 番 
                (基础${fanInfo.baseTotal}番 + 附加${fanInfo.specialTotal}番)
            </div>
            <div id="fan-details" class="mt-2">
                ${fanInfo.details.map(item => `<span class="fan-item ${item.type}-fan">${item.name}(${item.fan}番)</span>`).join('')}
            </div>
            <div class="score-result">
                底分：${baseScore} | 最终得分：<span class="final-score">${baseScore} × ${totalFan} = ${finalScore}</span>
            </div>
            <div class="mt-2 text-sm text-gray-500">当前规则：${getRuleName()}</div>
        `;
        
        // 生成胡牌牌型分解
        generateHuPatternDisplay(huPattern);
        patternArea.classList.remove('hidden');
    } else {
        // 听牌逻辑
        const tingInfo = checkTingAll(cardsArray);
        if (tingInfo.tingCards.length > 0) {
            const predictFan = predictTingFan(cardsArray, tingInfo.tingCards[0]);
            resultHtml = `
                <div class="text-blue-600 font-medium mb-2">听牌！</div>
                <div>可胡牌：<span class="font-bold">${tingInfo.tingCards.join('、')}</span></div>
                <div class="mt-2">胡牌预计：<span class="font-bold">${predictFan.fan}</span>番 
                    (<span class="fan-type">${predictFan.types.join('+')}</span>)
                </div>
                <div class="mt-2 text-sm text-gray-500">当前规则：${getRuleName()}</div>
            `;
        } else {
            // 未听牌，显示弃牌推荐
            const recommendList = getDiscardRecommend(cardsArray);
            resultHtml = `
                <div class="text-orange-600 font-medium mb-2">未听牌</div>
                <div>推荐以下弃牌策略：</div>
            `;
            showOptimizedRecommend(recommendList);
            recommendArea.classList.remove('hidden');
        }
    }

    // 渲染结果
    resultArea.innerHTML = resultHtml;
}

// 预测听牌胡牌后的番数
function predictTingFan(cardsArray, tingCard) {
    const tempCards = [...cardsArray, tingCard];
    const tempGroups = organizeCards(tempCards);
    const fanInfo = calculateFan(tempGroups);
    const types = fanInfo.details.map(item => item.name);
    return {
        fan: fanInfo.baseTotal + fanInfo.specialTotal,
        types: types.length > 0 ? types : ['平胡']
    };
}

// 分析胡牌牌型（普通/七对）
function analyzeHuPattern(cardGroups, cardsArray) {
    // 七对牌型
    if (checkQiDui(cardGroups)) {
        const pairs = [];
        for (const [type, cards] of Object.entries(cardTypes)) {
            cards.forEach(card => {
                const count = handCards[card] || 0;
                if (count >= 2) {
                    const pairCount = Math.floor(count / 2);
                    for (let i = 0; i < pairCount; i++) {
                        pairs.push({ type: 'pair', cards: [card, card] });
                    }
                }
            });
        }
        return { type: 'qidui', jiang: null, groups: pairs };
    }

    // 普通牌型（将+刻/顺）
    const pattern = { jiang: null, groups: [] };
    const tempGroups = JSON.parse(JSON.stringify(cardGroups));
    let foundJiang = false;

    // 找将牌（对子）
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (tempGroups[type][i] >= 2) {
                const cardName = getCardNameByIndex(type, i);
                pattern.jiang = { type: 'jiang', cards: [cardName, cardName] };
                tempGroups[type][i] -= 2;
                foundJiang = true;
                break;
            }
        }
        if (foundJiang) break;
    }

    // 找字牌刻子
    for (let i = 0; i < 7; i++) {
        if (tempGroups.zapai[i] === 3) {
            const cardName = getCardNameByIndex('zapai', i);
            pattern.groups.push({ type: 'ke', cards: [cardName, cardName, cardName] });
            tempGroups.zapai[i] = 0;
        }
    }

    // 找序数牌刻子/顺子
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (tempGroups[type][i] === 0) continue;
            // 刻子
            if (tempGroups[type][i] === 3) {
                const cardName = getCardNameByIndex(type, i);
                pattern.groups.push({ type: 'ke', cards: [cardName, cardName, cardName] });
                tempGroups[type][i] = 0;
            }
            // 顺子
            else if (i <= 6 && tempGroups[type][i] >= 1 && tempGroups[type][i+1] >= 1 && tempGroups[type][i+2] >= 1) {
                const c1 = getCardNameByIndex(type, i);
                const c2 = getCardNameByIndex(type, i+1);
                const c3 = getCardNameByIndex(type, i+2);
                pattern.groups.push({ type: 'shun', cards: [c1, c2, c3] });
                tempGroups[type][i]--;
                tempGroups[type][i+1]--;
                tempGroups[type][i+2]--;
                i--;
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
    if (type === 'zapai') return ['东', '南', '西', '北', '中', '发', '白'][index] || '';
    return '';
}

// 生成胡牌牌型分解的DOM展示
function generateHuPatternDisplay(pattern) {
    const container = document.getElementById('pattern-container');
    if (!container) return;
    container.innerHTML = '';

    // 七对牌型展示
    if (pattern.type === 'qidui') {
        const title = document.createElement('div');
        title.className = 'text-center font-medium mb-3';
        title.textContent = window.isLongQiDui ? '龙七对牌型' : '七对牌型';
        container.appendChild(title);

        const pairsContainer = document.createElement('div');
        pairsContainer.className = 'flex flex-wrap justify-center gap-2';
        pattern.groups.forEach(pair => pairsContainer.appendChild(createPatternGroup('对子', pair.cards, 'jiang-group')));
        container.appendChild(pairsContainer);
        return;
    }

    // 普通牌型：将牌
    if (pattern.jiang) {
        container.appendChild(createPatternGroup('将牌', pattern.jiang.cards, 'jiang-group'));
    }

    // 普通牌型：刻子/顺子
    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'flex flex-wrap justify-center gap-2';
    pattern.groups.forEach(group => {
        const name = group.type === 'ke' ? '刻子' : '顺子';
        const cls = group.type === 'ke' ? 'ke-group' : 'shun-group';
        groupsContainer.appendChild(createPatternGroup(name, group.cards, cls));
    });
    container.appendChild(groupsContainer);
}

// 修改：创建带图标的单个牌型组（将/刻/顺）的DOM
function createPatternGroup(title, cards, className) {
    const group = document.createElement('div');
    group.className = `pattern-group ${className}`;
    
    const titleEl = document.createElement('div');
    titleEl.className = 'pattern-title';
    titleEl.textContent = title;
    group.appendChild(titleEl);
    
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'pattern-cards';
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'pattern-card';
        // 插入麻将图标
        const { iconClass, typeClass } = getMahjongIcon(card);
        cardEl.innerHTML = `
            <i class="mahjong-icon ${iconClass} ${typeClass}"></i>
            <span class="mahjong-text">${card}</span>
        `;
        cardsContainer.appendChild(cardEl);
    });
    
    group.appendChild(cardsContainer);
    return group;
}

// 整理手牌为计数分组（方便分析）
function organizeCards(cards) {
    const groups = {
        wanzi: Array(9).fill(0), tiaozi: Array(9).fill(0), tongzi: Array(9).fill(0), zapai: Array(7).fill(0),
        total: { wanzi: 0, tiaozi: 0, tongzi: 0, zapai: 0 }
    };
    const zapaiMap = { '东':0,'南':1,'西':2,'北':3,'中':4,'发':5,'白':6 };

    cards.forEach(card => {
        if (card.includes('万')) {
            const idx = parseInt(card) - 1;
            if (idx >=0 && idx <9) groups.wanzi[idx]++;
            groups.total.wanzi++;
        } else if (card.includes('条')) {
            const idx = parseInt(card) - 1;
            if (idx >=0 && idx <9) groups.tiaozi[idx]++;
            groups.total.tiaozi++;
        } else if (card.includes('筒')) {
            const idx = parseInt(card) - 1;
            if (idx >=0 && idx <9) groups.tongzi[idx]++;
            groups.total.tongzi++;
        } else if (zapaiMap[card] !== undefined) {
            const idx = zapaiMap[card];
            groups.zapai[idx]++;
            groups.total.zapai++;
        }
    });

    return groups;
}

// 补充缺失的工具函数（避免报错）
function showToast(msg) {
    // 简单的提示框实现
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 9999;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function isHu(cardGroups, totalCount) {
    // 简化版胡牌判断（可根据实际逻辑完善）
    if (totalCount !== 14) return false;
    // 七对判断
    if (checkQiDui(cardGroups)) return true;
    // 普通胡牌（将+4组刻/顺）
    return checkNormalHu(cardGroups);
}

function checkQiDui(cardGroups) {
    let pairCount = 0;
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            pairCount += Math.floor(cardGroups[type][i] / 2);
        }
    }
    return pairCount === 7;
}

function checkNormalHu(cardGroups) {
    // 简化版普通胡牌判断（核心逻辑：找将牌 + 剩余牌组成刻/顺）
    const tempGroups = JSON.parse(JSON.stringify(cardGroups));
    // 遍历所有可能的将牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (tempGroups[type][i] >= 2) {
                tempGroups[type][i] -= 2;
                if (checkAllGroups(tempGroups)) {
                    return true;
                }
                tempGroups[type][i] += 2; // 回溯
            }
        }
    }
    return false;
}

function checkAllGroups(groups) {
    // 检查是否所有牌都能组成刻/顺
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        let i = 0;
        while (i < 9) {
            if (groups[type][i] === 0) {
                i++;
                continue;
            }
            // 刻子
            if (groups[type][i] === 3) {
                groups[type][i] = 0;
                i++;
            }
            // 顺子
            else if (i <= 6 && groups[type][i] >=1 && groups[type][i+1] >=1 && groups[type][i+2] >=1) {
                groups[type][i]--;
                groups[type][i+1]--;
                groups[type][i+2]--;
            } else {
                return false;
            }
        }
    }
    // 检查字牌（只能是刻子）
    for (let i = 0; i < 7; i++) {
        if (groups.zapai[i] !== 0 && groups.zapai[i] !== 3) {
            return false;
        }
    }
    return true;
}

function checkTingAll(cardsArray) {
    // 简化版听牌判断：遍历所有可能的牌，检查胡牌
    const tingCards = [];
    const allCards = [...cardTypes.wanzi, ...cardTypes.tiaozi, ...cardTypes.tongzi, ...cardTypes.zapai];
    for (const card of allCards) {
        if (handCards[card] >= 4) continue; // 牌已选满4张
        const tempCards = [...cardsArray, card];
        const tempGroups = organizeCards(tempCards);
        if (isHu(tempGroups, tempCards.length)) {
            tingCards.push(card);
        }
    }
    return { tingCards };
}

function getDiscardRecommend(cardsArray) {
    // 简化版弃牌推荐
    const recommendList = [];
    const uniqueCards = [...new Set(cardsArray)];
    uniqueCards.forEach(card => {
        const tempCards = cardsArray.filter(c => c !== card);
        const tingInfo = checkTingAll(tempCards);
        if (tingInfo.tingCards.length > 0) {
            recommendList.push({
                card,
                type: 'attack', // 进攻型：弃牌后听牌
                tingCards: tingInfo.tingCards,
                fan: predictTingFan(tempCards, tingInfo.tingCards[0]).fan
            });
        } else {
            recommendList.push({
                card,
                type: 'defense', // 防守型：暂不听牌，推荐弃安全牌
                tingCards: [],
                fan: 0
            });
        }
    });
    return recommendList;
}

function showOptimizedRecommend(recommendList) {
    const container = document.getElementById('recommend-list');
    container.innerHTML = '';
    recommendList.forEach(item => {
        const el = document.createElement('div');
        el.className = `recommend-item ${item.type}`;
        const label = item.type === 'attack' ? '进攻' : '防守';
        const labelCls = item.type === 'attack' ? 'label-attack' : 'label-defense';
        let tingText = '';
        if (item.tingCards.length > 0) {
            tingText = `可听：<span class="highlight-card">${item.tingCards.join('、')}</span>（预计${item.fan}番）`;
        } else {
            tingText = '暂不听牌，优先弃出';
        }
        el.innerHTML = `
            <span class="recommend-label ${labelCls}">${label}</span>
            弃 <span class="highlight-card">${item.card}</span> → ${tingText}
        `;
        container.appendChild(el);
    });
}

function getRuleName() {
    switch (currentRule) {
        case 'national': return '国标麻将（2011版）';
        case 'sichuan': return '四川麻将';
        case 'guangdong': return '广东麻将';
        default: return '国标麻将';
    }
}

function calculateFan(cardGroups) {
    const fanInfo = {
        baseTotal: 0,
        specialTotal: 0,
        details: []
    };
    const rules = fanDefinitions[currentRule];

    // 基础番型判断（示例：断幺九、平胡、碰碰胡等）
    // 1. 断幺九
    if (checkDuanYaoJiu(cardGroups)) {
        fanInfo.baseTotal += rules.duanyaojiu.fan;
        fanInfo.details.push({
            name: rules.duanyaojiu.name,
            fan: rules.duanyaojiu.fan,
            type: rules.duanyaojiu.type
        });
    }

    // 2. 平胡（简化判断）
    if (checkPingHu(cardGroups)) {
        fanInfo.baseTotal += rules.pinghu.fan;
        fanInfo.details.push({
            name: rules.pinghu.name,
            fan: rules.pinghu.fan,
            type: rules.pinghu.type
        });
    }

    // 3. 碰碰胡
    if (checkPengPengHu(cardGroups)) {
        fanInfo.baseTotal += rules.pengpenghu.fan;
        fanInfo.details.push({
            name: rules.pengpenghu.name,
            fan: rules.pengpenghu.fan,
            type: rules.pengpenghu.type
        });
    }

    // 4. 清一色
    if (checkQingYiSe(cardGroups)) {
        fanInfo.baseTotal += rules.qingyise.fan;
        fanInfo.details.push({
            name: rules.qingyise.name,
            fan: rules.qingyise.fan,
            type: rules.qingyise.type
        });
    }

    // 5. 七对
    if (checkQiDui(cardGroups)) {
        fanInfo.baseTotal += rules.qidui.fan;
        fanInfo.details.push({
            name: rules.qidui.name,
            fan: rules.qidui.fan,
            type: rules.qidui.type
        });
    }

    // 附加番（示例：默认暂不计算，可根据实际场景扩展）
    // fanInfo.specialTotal += rules.gangshanghua.fan;

    return fanInfo;
}

// 番型判断辅助函数
function checkDuanYaoJiu(cardGroups) {
    // 断幺九：无1/9序数牌、无字牌
    // 检查1/9序数牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        if (cardGroups[type][0] > 0 || cardGroups[type][8] > 0) return false;
    }
    // 检查字牌
    for (let i = 0; i < 7; i++) {
        if (cardGroups.zapai[i] > 0) return false;
    }
    return true;
}

function checkPingHu(cardGroups) {
    // 平胡：简化判断（无刻子、无字牌、将牌为2-8序数牌）
    // 检查字牌
    for (let i = 0; i < 7; i++) {
        if (cardGroups.zapai[i] > 0) return false;
    }
    // 检查无刻子
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (cardGroups[type][i] === 3) return false;
        }
    }
    return true;
}

function checkPengPengHu(cardGroups) {
    // 碰碰胡：所有牌都是刻子+将牌
    let keCount = 0;
    // 检查序数牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (cardGroups[type][i] === 3) keCount++;
            else if (cardGroups[type][i] !== 0 && cardGroups[type][i] !== 2) return false;
        }
    }
    // 检查字牌
    for (let i = 0; i < 7; i++) {
        if (cardGroups.zapai[i] === 3) keCount++;
        else if (cardGroups.zapai[i] !== 0 && cardGroups.zapai[i] !== 2) return false;
    }
    return keCount === 4; // 4组刻子 + 1对将牌
}

function checkQingYiSe(cardGroups) {
    // 清一色：只有一种序数牌（万/条/筒）
    const hasWan = cardGroups.total.wanzi > 0;
    const hasTiao = cardGroups.total.tiaozi > 0;
    const hasTong = cardGroups.total.tongzi > 0;
    const hasZi = cardGroups.total.zapai > 0;
    // 只能有一种序数牌，且无字牌
    return !hasZi && ((hasWan && !hasTiao && !hasTong) || 
                      (!hasWan && hasTiao && !hasTong) || 
                      (!hasWan && !hasTiao && hasTong));
}
