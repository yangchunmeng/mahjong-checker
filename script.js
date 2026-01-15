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
    const baseScoreEl = document.getElementById('base-score');
    if (baseScoreEl) {
        baseScoreEl.disabled = true;
        baseScoreEl.value = 5; // 重置底分输入框为默认值
    }
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

// 创建牌面元素 + 手机触控反馈
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

    // 底分输入（替换原下拉框事件，支持自由输入）
    const baseScoreEl = document.getElementById('base-score');
    if (baseScoreEl) {
        baseScoreEl.addEventListener('input', (e) => {
            // 校验数值：最小为1，非数字则重置为5
            let inputVal = parseInt(e.target.value);
            if (isNaN(inputVal) || inputVal < 1) {
                inputVal = 5;
                e.target.value = 5;
            }
            baseScore = inputVal;
            
            // 胡牌状态下实时重新计算得分
            if (!document.getElementById('hu-pattern-display').classList.contains('hidden')) {
                const cardsArray = getHandCardsArray();
                const cardGroups = organizeCards(cardsArray);
                reCalculateScore(cardGroups);
            }
        });
    }

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

// 更新当前手牌显示（修复重复牌显示问题）
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
    
    // 统计每张牌的数量（移除去重逻辑，保留重复牌计数）
    const cardCountMap = {};
    cardsArray.forEach(card => {
        cardCountMap[card] = (cardCountMap[card] || 0) + 1;
    });

    // 生成手牌元素（按计数显示，支持重复牌）
    Object.entries(cardCountMap).forEach(([card, count]) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'ma-card hand-card';
        cardEl.dataset.card = card;
        cardEl.textContent = card;
        cardEl.style.cursor = 'default';
        
        // 删除按钮（阻止冒泡，点击一次减少一张）
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handCards[card]--;
            // 确保数量不小于0
            if (handCards[card] < 0) handCards[card] = 0;
            updateCardLibraryDisplay();
            updateHandCardDisplay();
        });
        cardEl.appendChild(delBtn);

        // 数量徽章（数量>1时显示）
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
    if (baseScoreEl) baseScoreEl.disabled = true;

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
        
        // 启用底分输入框
        if (baseScoreEl) {
            baseScoreEl.disabled = false;
            baseScoreEl.value = baseScore;
        }

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

// 以下为补充缺失的核心函数（保证代码完整性）
function showToast(msg) {
    // 简易提示框实现
    let toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 8px 16px; background: rgba(0,0,0,0.7); color: #fff;
        border-radius: 4px; font-size: 14px; z-index: 9999;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
}

function getRuleName() {
    const ruleMap = {
        national: '国标麻将（2011版）',
        sichuan: '四川麻将',
        guangdong: '广东麻将'
    };
    return ruleMap[currentRule] || '国标麻将';
}

function isHu(cardGroups, totalCount) {
    // 简化版胡牌判断（完整逻辑需结合麻将规则）
    if (totalCount !== 14 && totalCount !== 13) return false;
    // 七对胡牌
    if (checkQiDui(cardGroups)) return true;
    // 普通胡牌（将+4组刻/顺）
    return checkNormalHu(cardGroups);
}

function checkQiDui(cardGroups) {
    let pairCount = 0;
    window.isLongQiDui = false;
    let fourCount = 0;

    // 统计对子和四张相同牌数量
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            const count = cardGroups[type][i];
            if (count === 4) {
                fourCount++;
                pairCount += 2; // 四张算两个对子
            } else if (count === 2) {
                pairCount++;
            } else if (count % 2 !== 0) {
                return false; // 非偶数张直接排除
            }
        }
    }

    // 七对（7个对子）或龙七对（含四张相同牌，6个对子+1个四张）
    if (pairCount === 7) {
        window.isLongQiDui = fourCount > 0;
        return true;
    }
    return false;
}

function checkNormalHu(cardGroups) {
    // 复制分组避免修改原数据
    const tempGroups = JSON.parse(JSON.stringify(cardGroups));
    let jiangFound = false;

    // 寻找将牌（对子）
    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (tempGroups[type][i] >= 2) {
                tempGroups[type][i] -= 2;
                jiangFound = true;
                break;
            }
        }
        if (jiangFound) break;
    }

    if (!jiangFound) return false;

    // 检查剩余牌是否能组成刻子/顺子
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            while (tempGroups[type][i] > 0) {
                // 刻子
                if (tempGroups[type][i] >= 3) {
                    tempGroups[type][i] -= 3;
                }
                // 顺子
                else if (i <= 6 && tempGroups[type][i] >= 1 && tempGroups[type][i+1] >= 1 && tempGroups[type][i+2] >= 1) {
                    tempGroups[type][i]--;
                    tempGroups[type][i+1]--;
                    tempGroups[type][i+2]--;
                } else {
                    return false;
                }
            }
        }
    }

    // 检查字牌是否为刻子
    for (let i = 0; i < 7; i++) {
        if (tempGroups.zapai[i] !== 0 && tempGroups.zapai[i] !== 3) {
            return false;
        }
    }

    return true;
}

function calculateFan(cardGroups) {
    const fanList = fanDefinitions[currentRule];
    const details = [];
    let baseTotal = 0;
    let specialTotal = 0;

    // 断幺九
    if (checkDuanYaoJiu(cardGroups)) {
        details.push(fanList.duanyaojiu);
        baseTotal += fanList.duanyaojiu.fan;
    }

    // 平胡
    details.push(fanList.pinghu);
    baseTotal += fanList.pinghu.fan;

    // 碰碰胡
    if (checkPengPengHu(cardGroups)) {
        details.push(fanList.pengpenghu);
        baseTotal += fanList.pengpenghu.fan;
    }

    // 混一色
    if (checkHunYiSe(cardGroups)) {
        details.push(fanList.hunyise);
        baseTotal += fanList.hunyise.fan;
    }

    // 清一色
    if (checkQingYiSe(cardGroups)) {
        details.push(fanList.qingyise);
        baseTotal += fanList.qingyise.fan;
    }

    // 七对/龙七对
    if (checkQiDui(cardGroups)) {
        if (window.isLongQiDui) {
            details.push(fanList.longqidui);
            baseTotal += fanList.longqidui.fan;
        } else {
            details.push(fanList.qidui);
            baseTotal += fanList.qidui.fan;
        }
    }

    // 附加番（示例：默认包含杠上花，实际可根据交互扩展）
    details.push(fanList.gangshanghua);
    specialTotal += fanList.gangshanghua.fan;

    return { details, baseTotal, specialTotal };
}

function checkDuanYaoJiu(cardGroups) {
    // 检查是否无幺九牌和字牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        if (cardGroups[type][0] > 0 || cardGroups[type][8] > 0) return false;
    }
    for (let i = 0; i < 7; i++) {
        if (cardGroups.zapai[i] > 0) return false;
    }
    return true;
}

function checkPengPengHu(cardGroups) {
    // 碰碰胡：全为刻子+将牌
    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            const count = cardGroups[type][i];
            if (count !== 0 && count !== 2 && count !== 3) return false;
        }
    }
    for (let i = 0; i < 7; i++) {
        const count = cardGroups.zapai[i];
        if (count !== 0 && count !== 2 && count !== 3) return false;
    }
    return true;
}

function checkHunYiSe(cardGroups) {
    // 混一色：一种序数牌 + 字牌
    const hasWan = cardGroups.total.wanzi > 0;
    const hasTiao = cardGroups.total.tiaozi > 0;
    const hasTong = cardGroups.total.tongzi > 0;
    const hasZi = cardGroups.total.zapai > 0;

    const numTypes = [hasWan, hasTiao, hasTong].filter(Boolean).length;
    return numTypes === 1 && hasZi;
}

function checkQingYiSe(cardGroups) {
    // 清一色：仅一种序数牌，无字牌
    const hasWan = cardGroups.total.wanzi > 0;
    const hasTiao = cardGroups.total.tiaozi > 0;
    const hasTong = cardGroups.total.tongzi > 0;
    const hasZi = cardGroups.total.zapai > 0;

    const numTypes = [hasWan, hasTiao, hasTong].filter(Boolean).length;
    return numTypes === 1 && !hasZi;
}

function checkTingAll(cardsArray) {
    // 简化听牌检查：返回示例听牌（实际需完善）
    return { tingCards: [] };
}

function getDiscardRecommend(cardsArray) {
    // 简化弃牌推荐：返回示例数据
    return [
        { card: '1万', type: 'attack', desc: '弃1万可听2、5万', fanPreview: '预计3番' },
        { card: '9筒', type: 'defense', desc: '弃9筒防守型选择，降低点炮风险', fanPreview: '预计2番' }
    ];
}

function showOptimizedRecommend(recommendList) {
    const container = document.getElementById('recommend-list');
    if (!container) return;
    container.innerHTML = '';

    recommendList.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `recommend-item ${item.type}`;
        
        const label = document.createElement('span');
        label.className = `recommend-label label-${item.type}`;
        label.textContent = item.type === 'attack' ? '进攻' : '防守';
        
        const card = document.createElement('span');
        card.className = 'highlight-card';
        card.textContent = item.card;
        
        const desc = document.createElement('span');
        desc.textContent = ` ${item.desc}`;
        
        const fan = document.createElement('span');
        fan.className = 'fan-preview';
        fan.textContent = item.fanPreview;
        
        itemEl.appendChild(label);
        itemEl.appendChild(card);
        itemEl.appendChild(desc);
        itemEl.appendChild(fan);
        container.appendChild(itemEl);
    });
}
