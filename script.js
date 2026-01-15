const cardTypes = {
    wanzi: ['1万', '2万', '3万', '4万', '5万', '6万', '7万', '8万', '9万'],
    tiaozi: ['1条', '2条', '3条', '4条', '5条', '6条', '7条', '8条', '9条'],
    tongzi: ['1筒', '2筒', '3筒', '4筒', '5筒', '6筒', '7筒', '8筒', '9筒'],
    zapai: ['东', '南', '西', '北', '中', '发', '白']
};

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
let pengGangCards = {}; // 新增：碰/杠牌存储
let currentRule = 'national';
let lackType = 'none';
let baseScore = 5; 

// 页面加载完成后初始化（核心：保证DOM加载完再生成牌）
document.addEventListener('DOMContentLoaded', () => {
    initHandCards();
    initPengGangCards(); // 新增：初始化碰/杠牌
    generateCardLibrary();
    generatePengGangCardLibrary(); // 新增：生成碰/杠牌库
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

// 新增：初始化碰/杠牌计数
function initPengGangCards() {
    pengGangCards = {
        peng: {},    // 碰
        minggang: {},// 明杠
        angang: {}   // 暗杠
    };
    for (const pgType of ['peng', 'minggang', 'angang']) {
        for (const [type, cards] of Object.entries(cardTypes)) {
            cards.forEach(card => pengGangCards[pgType][card] = 0);
        }
    }
    updatePengGangCardDisplay();
}

// 生成手牌库（核心修复：容器校验+清空重绘，保证牌显示）
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

// 新增：生成碰/杠牌库
function generatePengGangCardLibrary() {
    for (const [type, cards] of Object.entries(cardTypes)) {
        const container = document.getElementById(`pg-${type}-container`);
        if (!container) continue;
        container.innerHTML = '';
        cards.forEach(card => {
            const cardEl = createPengGangCardElement(card, type);
            container.appendChild(cardEl);
        });
    }
}

// 创建手牌元素 + 手机触控反馈
function createCardElement(card, type) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ma-card';
    cardEl.dataset.card = card;
    cardEl.textContent = card;
    
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

// 新增：创建碰/杠牌元素
function createPengGangCardElement(card, type) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ma-card';
    cardEl.dataset.card = card;
    cardEl.textContent = card;
    
    // 选牌逻辑
    cardEl.addEventListener('click', () => {
        const pgType = document.getElementById('pg-type-selector').value;
        // 碰：最多1组（3张），杠：最多1组（4张）
        const maxCount = pgType === 'peng' ? 3 : 4;
        
        if (pengGangCards[pgType][card] >= maxCount) {
            const tip = pgType === 'peng' ? '碰' : (pgType === 'minggang' ? '明杠' : '暗杠');
            showToast(`【${card}】最多${maxCount}张（${tip}）`);
            return;
        }
        if (isLackCard(card)) return;
        
        pengGangCards[pgType][card] = maxCount; // 碰/杠直接选满对应数量
        updatePengGangCardLibraryDisplay();
        updatePengGangCardDisplay();
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
        updatePengGangCardDisplay(); // 新增：更新碰/杠牌定缺状态
    });

    // 底分切换（实时重新计算）
    document.getElementById('base-score').addEventListener('change', (e) => {
        baseScore = parseInt(e.target.value);
        if (!document.getElementById('hu-pattern-display').classList.contains('hidden')) {
            const cardsArray = getAllCardsArray(); // 修改：获取手牌+碰/杠牌
            const cardGroups = organizeCards(cardsArray);
            reCalculateScore(cardGroups);
        }
    });

    // 清空手牌
    document.getElementById('reset-btn').addEventListener('click', initHandCards);
    // 清空碰/杠牌
    document.getElementById('reset-penggang-btn').addEventListener('click', initPengGangCards);
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
    const pgZapaiSection = document.getElementById('pg-zapai-section'); // 新增：碰/杠字牌区
    
    if (currentRule === 'sichuan') {
        sichuanOptions.classList.remove('hidden');
        zapaiSection.classList.add('hidden');
        pgZapaiSection.classList.add('hidden'); // 四川麻将隐藏字牌碰/杠
    } else {
        sichuanOptions.classList.add('hidden');
        zapaiSection.classList.remove('hidden');
        pgZapaiSection.classList.remove('hidden');
    }
    updateLackCards();
    generateCardLibrary(); // 切换规则重新生成牌库，保证显示正常
    generatePengGangCardLibrary(); // 新增：重新生成碰/杠牌库
}

// 更新定缺牌（置灰不可选）
function updateLackCards() {
    // 手牌定缺
    document.querySelectorAll('.ma-card.disabled').forEach(el => el.classList.remove('disabled'));
    if (currentRule !== 'sichuan' || lackType === 'none') return;

    // 手牌定缺置灰
    const containerId = `${lackType}zi-container`;
    document.querySelectorAll(`#${containerId} .ma-card`).forEach(el => {
        el.classList.add('disabled');
        const card = el.dataset.card;
        handCards[card] = 0;
    });

    // 碰/杠牌定缺置灰
    const pgContainerId = `pg-${lackType}zi-container`;
    document.querySelectorAll(`#${pgContainerId} .ma-card`).forEach(el => {
        el.classList.add('disabled');
        const card = el.dataset.card;
        // 清空该牌的所有碰/杠状态
        for (const pgType of ['peng', 'minggang', 'angang']) {
            pengGangCards[pgType][card] = 0;
        }
    });
}

// 判断是否为定缺牌
function isLackCard(card) {
    if (currentRule !== 'sichuan' || lackType === 'none') return false;
    return (lackType === 'wan' && card.includes('万')) ||
           (lackType === 'tiao' && card.includes('条')) ||
           (lackType === 'tong' && card.includes('筒'));
}

// 更新手牌库显示（选中的牌显示数量徽章）
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

// 新增：更新碰/杠牌库显示
function updatePengGangCardLibraryDisplay() {
    const pgType = document.getElementById('pg-type-selector').value;
    document.querySelectorAll('#pg-wanzi-container .ma-card, #pg-tiaozi-container .ma-card, #pg-tongzi-container .ma-card, #pg-zapai-container .ma-card').forEach(el => {
        const card = el.dataset.card;
        const count = pengGangCards[pgType][card] || 0;
        
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
        cardEl.textContent = card;
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

// 新增：更新碰/杠牌显示
function updatePengGangCardDisplay() {
    const display = document.getElementById('pg-card-display');
    display.innerHTML = '';

    // 收集所有碰/杠牌
    const pgCards = [];
    for (const pgType of ['peng', 'minggang', 'angang']) {
        for (const [card, count] of Object.entries(pengGangCards[pgType])) {
            if (count > 0) {
                const typeName = pgType === 'peng' ? '碰' : (pgType === 'minggang' ? '明杠' : '暗杠');
                pgCards.push({ card, count, type: typeName });
            }
        }
    }

    if (pgCards.length === 0) {
        display.innerHTML = '<p class="text-gray-500 text-sm">暂无碰/杠牌，请从上方选择</p>';
        return;
    }

    // 生成碰/杠牌元素
    pgCards.forEach(item => {
        const cardEl = document.createElement('div');
        cardEl.className = 'ma-card hand-card';
        cardEl.dataset.card = item.card;
        cardEl.textContent = item.card;
        cardEl.style.cursor = 'default';
        
        // 操作类型标签
        const typeLabel = document.createElement('div');
        typeLabel.className = 'count-badge';
        typeLabel.textContent = item.type;
        typeLabel.style.backgroundColor = pgType === 'peng' ? '#28a745' : '#dc3545';
        cardEl.appendChild(typeLabel);

        // 删除按钮
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 找到对应类型并清空
            for (const pgType of ['peng', 'minggang', 'angang']) {
                if (pengGangCards[pgType][item.card] > 0) {
                    pengGangCards[pgType][item.card] = 0;
                    break;
                }
            }
            updatePengGangCardLibraryDisplay();
            updatePengGangCardDisplay();
        });
        cardEl.appendChild(delBtn);

        display.appendChild(cardEl);
    });
}

// 将手牌计数转为数组（方便后续分析）
function getHandCardsArray() {
    const arr = [];
    for (const [card, count] of Object.entries(handCards)) {
        for (let i = 0; i < (count || 0); i++) arr.push(card);
    }
    return arr;
}

// 新增：获取手牌+碰/杠牌的完整数组
function getAllCardsArray() {
    const handArr = getHandCardsArray();
    const pgArr = [];
    
    // 加入碰/杠牌
    for (const pgType of ['peng', 'minggang', 'angang']) {
        for (const [card, count] of Object.entries(pengGangCards[pgType])) {
            for (let i = 0; i < (count || 0); i++) pgArr.push(card);
        }
    }
    
    return [...handArr, ...pgArr];
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
    const allCardsArray = getAllCardsArray(); // 手牌+碰/杠牌
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

    const cardGroups = organizeCards(allCardsArray); // 修改：使用完整牌组
    let resultHtml = '';

    // 胡牌逻辑
    if (isHu(cardGroups, totalCount)) {
        const fanInfo = calculateFan(cardGroups);
        const totalFan = fanInfo.baseTotal + fanInfo.specialTotal;
        const finalScore = baseScore * totalFan;
        const huPattern = analyzeHuPattern(cardGroups, allCardsArray);
        
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
    const allTempCards = [...tempCards, ...getAllCardsArray().filter(c => cardsArray.indexOf(c) === -1)]; // 加入碰/杠牌
    const tempGroups = organizeCards(allTempCards);
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

    // 新增：显示碰/杠牌型
    const pgGroups = [];
    for (const pgType of ['peng', 'minggang', 'angang']) {
        for (const [card, count] of Object.entries(pengGangCards[pgType])) {
            if (count > 0) {
                const typeName = pgType === 'peng' ? '碰' : (pgType === 'minggang' ? '明杠' : '暗杠');
                const cards = Array(count).fill(card);
                pgGroups.push({ type: typeName, cards });
            }
        }
    }

    if (pgGroups.length > 0) {
        const pgTitle = document.createElement('div');
        pgTitle.className = 'text-center font-medium mt-4 mb-2 text-gray-700';
        pgTitle.textContent = '碰/杠牌型';
        container.appendChild(pgTitle);

        const pgContainer = document.createElement('div');
        pgContainer.className = 'flex flex-wrap justify-center gap-2';
        pgGroups.forEach(group => {
            pgContainer.appendChild(createPatternGroup(group.type, group.cards, 'ke-group'));
        });
        container.appendChild(pgContainer);
    }
}

// 创建单个牌型组（将/刻/顺）的DOM
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
        cardEl.textContent = card;
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

// 核心：计算番数（重构：加入碰/杠牌判定清一色/混一色）
function calculateFan(cardGroups) {
    const fanInfo = {
        baseTotal: 0,
        specialTotal: 0,
        details: []
    };
    const currentFanDef = fanDefinitions[currentRule];

    // 基础番型判定
    // 1. 平胡
    fanInfo.baseTotal += currentFanDef.pinghu.fan;
    fanInfo.details.push({ ...currentFanDef.pinghu });

    // 2. 断幺九
    if (checkDuanYaoJiu(cardGroups)) {
        fanInfo.baseTotal += currentFanDef.duanyaojiu.fan;
        fanInfo.details.push({ ...currentFanDef.duanyaojiu });
    }

    // 3. 碰碰胡
    if (checkPengPengHu(cardGroups)) {
        fanInfo.baseTotal += currentFanDef.pengpenghu.fan;
        fanInfo.details.push({ ...currentFanDef.pengpenghu });
    }

    // 4. 清一色（重构：包含碰/杠牌判定）
    if (checkQingYiSe(cardGroups)) {
        fanInfo.baseTotal += currentFanDef.qingyise.fan;
        fanInfo.details.push({ ...currentFanDef.qingyise });
    } 
    // 5. 混一色（重构：包含碰/杠牌判定）
    else if (checkHunYiSe(cardGroups)) {
        fanInfo.baseTotal += currentFanDef.hunyise.fan;
        fanInfo.details.push({ ...currentFanDef.hunyise });
    }

    // 6. 七对/龙七对
    if (checkQiDui(cardGroups)) {
        if (checkLongQiDui(cardGroups)) {
            fanInfo.baseTotal += currentFanDef.longqidui.fan;
            fanInfo.details.push({ ...currentFanDef.longqidui });
            window.isLongQiDui = true;
        } else {
            fanInfo.baseTotal += currentFanDef.qidui.fan;
            fanInfo.details.push({ ...currentFanDef.qidui });
            window.isLongQiDui = false;
        }
    }

    // 7. 门清（无碰/杠）
    const hasPengGang = Object.values(pengGangCards.peng).some(c => c > 0) || 
                        Object.values(pengGangCards.minggang).some(c => c > 0);
    if (!hasPengGang && currentFanDef.menqing) {
        fanInfo.baseTotal += currentFanDef.menqing.fan;
        fanInfo.details.push({ ...currentFanDef.menqing });
    }

    // 8. 幺九刻
    if (checkYaoJiuKe(cardGroups) && currentFanDef.yaojiuke) {
        fanInfo.baseTotal += currentFanDef.yaojiuke.fan;
        fanInfo.details.push({ ...currentFanDef.yaojiuke });
    }

    // 9. 平和
    if (checkPingHe(cardGroups) && currentFanDef.pinghe) {
        fanInfo.baseTotal += currentFanDef.pinghe.fan;
        fanInfo.details.push({ ...currentFanDef.pinghe });
    }

    // 10. 明杠/暗杠
    const hasMingGang = Object.values(pengGangCards.minggang).some(c => c > 0);
    const hasAnGang = Object.values(pengGangCards.angang).some(c => c > 0);
    if (hasMingGang && currentFanDef.minggang) {
        fanInfo.baseTotal += currentFanDef.minggang.fan;
        fanInfo.details.push({ ...currentFanDef.minggang });
    }
    if (hasAnGang && currentFanDef.angang) {
        fanInfo.baseTotal += currentFanDef.angang.fan;
        fanInfo.details.push({ ...currentFanDef.angang });
    }

    // 11. 广东麻将自摸
    if (currentRule === 'guangdong' && currentFanDef.zimojia) {
        fanInfo.baseTotal += currentFanDef.zimojia.fan;
        fanInfo.details.push({ ...currentFanDef.zimojia });
    }

    // 特殊番型（杠上花/海底捞月，示例默认加1组，实际可根据需求调整）
    fanInfo.specialTotal += currentFanDef.gangshanghua.fan;
    fanInfo.details.push({ ...currentFanDef.gangshanghua });
    fanInfo.specialTotal += currentFanDef.haidilaoyue.fan;
    fanInfo.details.push({ ...currentFanDef.haidilaoyue });

    return fanInfo;
}

// 判定断幺九
function checkDuanYaoJiu(cardGroups) {
    // 无1/9序数牌
    const hasYaoJiu = cardGroups.wanzi[0] > 0 || cardGroups.wanzi[8] > 0 ||
                      cardGroups.tiaozi[0] > 0 || cardGroups.tiaozi[8] > 0 ||
                      cardGroups.tongzi[0] > 0 || cardGroups.tongzi[8] > 0;
    // 无字牌
    const hasZapai = cardGroups.zapai.some(c => c > 0);
    
    return !hasYaoJiu && !hasZapai;
}

// 判定碰碰胡
function checkPengPengHu(cardGroups) {
    // 所有牌都是刻子/碰/杠 + 将牌
    // 简化判定：序数牌无顺子，且字牌都是刻子
    let hasShun = false;
    
    // 检查序数牌是否有顺子（简化版）
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 7; i++) {
            if (cardGroups[type][i] > 0 && cardGroups[type][i+1] > 0 && cardGroups[type][i+2] > 0) {
                hasShun = true;
                break;
            }
        }
        if (hasShun) break;
    }
    
    return !hasShun;
}

// 重构：判定清一色（包含碰/杠牌）
function checkQingYiSe(cardGroups) {
    // 四川麻将定缺后无法清一色
    if (currentRule === 'sichuan' && lackType !== 'none') return false;

    const totalWan = cardGroups.total.wanzi;
    const totalTiao = cardGroups.total.tiaozi;
    const totalTong = cardGroups.total.tongzi;
    const totalZap = cardGroups.total.zapai;

    // 只有万/条/筒中的一种，且无字牌
    return (
        (totalWan > 0 && totalTiao === 0 && totalTong === 0 && totalZap === 0) ||
        (totalTiao > 0 && totalWan === 0 && totalTong === 0 && totalZap === 0) ||
        (totalTong > 0 && totalWan === 0 && totalTiao === 0 && totalZap === 0)
    );
}

// 重构：判定混一色（包含碰/杠牌）
function checkHunYiSe(cardGroups) {
    const totalWan = cardGroups.total.wanzi;
    const totalTiao = cardGroups.total.tiaozi;
    const totalTong = cardGroups.total.tongzi;
    const totalZap = cardGroups.total.zapai;

    // 一种序数牌 + 字牌，无其他序数牌
    const hasOneType = (totalWan > 0 && totalTiao === 0 && totalTong === 0) ||
                       (totalTiao > 0 && totalWan === 0 && totalTong === 0) ||
                       (totalTong > 0 && totalWan === 0 && totalTiao === 0);
    
    return hasOneType && totalZap > 0;
}

// 判定七对
function checkQiDui(cardGroups) {
    // 简化判定：手牌数为14张，且都是对子
    const totalCards = cardGroups.total.wanzi + cardGroups.total.tiaozi + cardGroups.total.tongzi + cardGroups.total.zapai;
    if (totalCards !== 14) return false;

    // 所有牌的数量都是2或4（龙七对）
    let isValid = true;
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            const count = cardGroups[type][i];
            if (count !== 0 && count !== 2 && count !== 4) {
                isValid = false;
                break;
            }
        }
        if (!isValid) break;
    }
    
    return isValid;
}

// 判定龙七对
function checkLongQiDui(cardGroups) {
    // 有四张相同的牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (cardGroups[type][i] === 4) {
                return true;
            }
        }
    }
    return false;
}

// 判定幺九刻
function checkYaoJiuKe(cardGroups) {
    // 有幺九牌的刻子
    return cardGroups.wanzi[0] === 3 || cardGroups.wanzi[8] === 3 ||
           cardGroups.tiaozi[0] === 3 || cardGroups.tiaozi[8] === 3 ||
           cardGroups.tongzi[0] === 3 || cardGroups.tongzi[8] === 3;
}

// 判定平和
function checkPingHe(cardGroups) {
    // 全是顺子 + 将牌，无刻子/碰/杠
    const hasKe = cardGroups.wanzi.some(c => c === 3) ||
                  cardGroups.tiaozi.some(c => c === 3) ||
                  cardGroups.tongzi.some(c => c === 3) ||
                  cardGroups.zapai.some(c => c === 3);
    const hasPengGang = Object.values(pengGangCards.peng).some(c => c > 0) ||
                        Object.values(pengGangCards.minggang).some(c => c > 0) ||
                        Object.values(pengGangCards.angang).some(c => c > 0);
    
    return !hasKe && !hasPengGang;
}

// 判定胡牌（简化版）
function isHu(cardGroups, handCount) {
    // 普通胡牌：手牌数13张（+1胡牌），或七对14张
    if (handCount !== 13 && handCount !== 14) return false;

    // 七对胡牌
    if (handCount === 14 && checkQiDui(cardGroups)) return true;

    // 普通胡牌：有将牌 + 4组刻子/顺子
    // 简化判定：总数符合 (13 - 2) = 11 不是3的倍数，实际需更复杂逻辑，此处返回true用于演示
    return true;
}

// 以下为占位函数（保证代码完整性）
function checkTingAll(cardsArray) {
    return { tingCards: [] };
}

function getDiscardRecommend(cardsArray) {
    return [];
}

function showOptimizedRecommend(list) {}

function showToast(msg) {
    alert(msg);
}

function getRuleName() {
    switch(currentRule) {
        case 'national': return '国标麻将（2011版）';
        case 'sichuan': return '四川麻将';
        case 'guangdong': return '广东麻将';
        default: return '国标麻将';
    }
}
