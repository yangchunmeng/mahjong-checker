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

let handCards = {};
let currentRule = 'national';
let lackType = 'none';
let baseScore = 5; 

document.addEventListener('DOMContentLoaded', () => {
    initHandCards();
    generateCardLibrary();
    bindEvents();
    updateRuleUI();
});

function initHandCards() {
    handCards = {};
    for (const [type, cards] of Object.entries(cardTypes)) {
        cards.forEach(card => handCards[card] = 0);
    }
    updateHandCardDisplay();
    document.getElementById('base-score').disabled = true;
}

function generateCardLibrary() {
    for (const [type, cards] of Object.entries(cardTypes)) {
        const container = document.getElementById(`${type}-container`);
        cards.forEach(card => {
            const cardEl = createCardElement(card, type);
            container.appendChild(cardEl);
        });
    }
}

function createCardElement(card, type) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ma-card';
    cardEl.dataset.card = card;
    cardEl.textContent = card;
    
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

    cardEl.addEventListener('touchstart', () => cardEl.classList.add('active'));
    cardEl.addEventListener('touchend', () => cardEl.classList.remove('active'));
    cardEl.addEventListener('touchcancel', () => cardEl.classList.remove('active'));

    return cardEl;
}

function bindEvents() {
    document.getElementById('rule-selector').addEventListener('change', (e) => {
        currentRule = e.target.value;
        updateRuleUI();
    });

    document.getElementById('lack-selector').addEventListener('change', (e) => {
        lackType = e.target.value;
        updateLackCards();
        updateHandCardDisplay();
    });

    document.getElementById('base-score').addEventListener('change', (e) => {
        baseScore = parseInt(e.target.value);
        if (document.getElementById('hu-pattern-display').classList.contains('hidden') === false) {
            const cardsArray = getHandCardsArray();
            const cardGroups = organizeCards(cardsArray);
            reCalculateScore(cardGroups);
        }
    });

    document.getElementById('reset-btn').addEventListener('click', initHandCards);
    document.getElementById('analyze-btn').addEventListener('click', analyzeHand);
    document.getElementById('sort-hand-btn').addEventListener('click', () => {
        updateHandCardDisplay(true);
    });
}

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

function isLackCard(card) {
    if (currentRule !== 'sichuan' || lackType === 'none') return false;
    return (lackType === 'wan' && card.includes('万')) ||
           (lackType === 'tiao' && card.includes('条')) ||
           (lackType === 'tong' && card.includes('筒'));
}

function updateCardLibraryDisplay() {
    document.querySelectorAll('.ma-card').forEach(el => {
        const card = el.dataset.card;
        const count = handCards[card];
        
        const oldBadge = el.querySelector('.count-badge');
        if (oldBadge) oldBadge.remove();

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

function sortHandCards(cardsArray) {
    const cardOrder = {
        '1万': 1, '2万': 2, '3万': 3, '4万': 4, '5万': 5, '6万': 6, '7万': 7, '8万': 8, '9万': 9,
        '1条': 10, '2条': 11, '3条': 12, '4条': 13, '5条': 14, '6条': 15, '7条': 16, '8条': 17, '9条': 18,
        '1筒': 19, '2筒': 20, '3筒': 21, '4筒': 22, '5筒': 23, '6筒': 24, '7筒': 25, '8筒': 26, '9筒': 27,
        '东': 28, '南': 29, '西': 30, '北': 31, '中': 32, '发': 33, '白': 34
    };

    return cardsArray.sort((a, b) => {
        return cardOrder[a] - cardOrder[b];
    });
}

function updateHandCardDisplay(forceSort = false) {
    const display = document.getElementById('hand-card-display');
    const countEl = document.getElementById('card-count');
    let cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;

    display.innerHTML = '';
    if (totalCount === 0) {
        display.innerHTML = '<p class="text-gray-500 text-sm">暂无手牌，请从牌库选择</p>';
        countEl.textContent = '0';
        return;
    }

    cardsArray = sortHandCards(cardsArray);
    const uniqueCards = [...new Set(cardsArray)];
    
    uniqueCards.forEach(card => {
        const count = handCards[card];
        const cardEl = createCardElement(card, getCardType(card));
        cardEl.classList.add('hand-card');
        cardEl.style.cursor = 'default';
        
        const delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => {
            handCards[card]--;
            updateCardLibraryDisplay();
            updateHandCardDisplay();
        });
        cardEl.appendChild(delBtn);

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

function getHandCardsArray() {
    const arr = [];
    for (const [card, count] of Object.entries(handCards)) {
        for (let i = 0; i < count; i++) arr.push(card);
    }
    return arr;
}

function getCardType(card) {
    if (card.includes('万')) return 'wanzi';
    if (card.includes('条')) return 'tiaozi';
    if (card.includes('筒')) return 'tongzi';
    return 'zapai';
}

function analyzeHand() {
    const resultArea = document.getElementById('result-area');
    const recommendArea = document.getElementById('discard-recommend');
    const patternArea = document.getElementById('hu-pattern-display');
    const cardsArray = getHandCardsArray();
    const totalCount = cardsArray.length;
    const baseScoreEl = document.getElementById('base-score');
    
    recommendArea.classList.add('hidden');
    patternArea.classList.add('hidden');
    baseScoreEl.disabled = true;

    if (totalCount === 0) {
        resultArea.innerHTML = '<p class="text-red-500">请先选择手牌</p>';
        return;
    }

    const cardGroups = organizeCards(cardsArray);
    let resultHtml = '';

    if (isHu(cardGroups, totalCount)) {
        const fanInfo = calculateFan(cardGroups);
        const totalFan = fanInfo.baseTotal + fanInfo.specialTotal;
        const finalScore = baseScore * totalFan;
        const huPattern = analyzeHuPattern(cardGroups, cardsArray);
        
        baseScoreEl.disabled = false;
        baseScoreEl.value = baseScore;

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
        
        generateHuPatternDisplay(huPattern);
        patternArea.classList.remove('hidden');
    } else {
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
            const recommendList = getDiscardRecommend(cardsArray);
            resultHtml = `
                <div class="text-orange-600 font-medium mb-2">未听牌</div>
                <div>推荐以下弃牌策略：</div>
            `;
            showOptimizedRecommend(recommendList);
            recommendArea.classList.remove('hidden');
        }
    }

    resultArea.innerHTML = resultHtml;
}

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

function analyzeHuPattern(cardGroups, cardsArray) {
    if (checkQiDui(cardGroups)) {
        const pairs = [];
        for (const [type, cards] of Object.entries(cardTypes)) {
            cards.forEach(card => {
                const count = handCards[card];
                if (count >= 2) {
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

    const pattern = {
        jiang: null,
        groups: []
    };

    const tempGroups = JSON.parse(JSON.stringify(cardGroups));
    let foundJiang = false;

    for (const type of ['wanzi', 'tiaozi', 'tongzi', 'zapai']) {
        const len = type === 'zapai' ? 7 : 9;
        for (let i = 0; i < len; i++) {
            if (tempGroups[type][i] >= 2) {
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

    for (const type of ['wanzi', 'tiaozi', 'tongzi']) {
        for (let i = 0; i < 9; i++) {
            if (tempGroups[type][i] === 0) continue;
            
            if (tempGroups[type][i] === 3) {
                const cardName = getCardNameByIndex(type, i);
                pattern.groups.push({
                    type: 'ke',
                    cards: [cardName, cardName, cardName]
                });
                tempGroups[type][i] = 0;
            }
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
                i--;
            }
        }
    }

    return pattern;
}

function getCardNameByIndex(type, index) {
    if (type === 'wanzi') return `${index + 1}万`;
    if (type === 'tiaozi') return `${index + 1}条`;
    if (type === 'tongzi') return `${index + 1}筒`;
    if (type === 'zapai') return ['东', '南', '西', '北', '中', '发', '白'][index];
    return '';
}

function generateHuPatternDisplay(pattern) {
    const container = document.getElementById('pattern-container');
    container.innerHTML = '';

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

    if (pattern.jiang) {
        const jiangGroup = createPatternGroup('将牌', pattern.jiang.cards, 'jiang-group');
        container.appendChild(jiangGroup);
    }

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
            groups.total.tongzi++;
        } else if (zapaiMap[card] !== undefined) {
            const idx = zapaiMap[card];
            groups.zapai[idx]++;
            groups.total.zapai++;
        }
    });

    return groups;
}

function isHu(cardGroups, totalCount) {
    if (totalCount % 3 !== 2 && !checkQiDui(cardGroups)) return false;
    if (checkQiDui(cardGroups)) return totalCount === 14;

    let copyGroups = JSON.parse(JSON.stringify(cardGroups));
    let jiangCount = 0;
    let valid = true;

    const checkGroups = (type) => {
        let arr = copyGroups[type];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === 0) continue;
            if (arr[i] === 2) {
                jiangCount++;
                arr[i] = 0;
            } else if (arr[i] === 3) {
                arr[i] = 0;
            } else if (i <= 6 && arr[i] >= 1 && arr[i+1] >= 1 && arr[i+2] >= 1) {
                arr[i]--;
                arr[i+1]--;
                arr[i+2]--;
                i--;
            } else {
                valid = false;
                break;
            }
        }
        copyGroups[type] = arr;
    };

    checkGroups('zapai');
    if (!valid) return false;
    checkGroups('wanzi');
    if (!valid) return false;
    checkGroups('tiaozi');
    if (!valid) return false;
    checkGroups('tongzi');
    if (!valid) return false;

    return jiangCount === 1 && valid;
}

function checkQiDui(cardGroups) {
    window.isLongQiDui = false;
    let pairCount = 0;
    let fourCount = 0;

    const checkType = (type) => {
        cardGroups[type].forEach(count => {
            if (count === 2) pairCount++;
            if (count === 4) {
                pairCount += 2;
                fourCount++;
            }
            if (count === 1 || count === 3) pairCount = -100;
        });
    };

    checkType('zapai');
    checkType('wanzi');
    checkType('tiaozi');
    checkType('tongzi');

    window.isLongQiDui = fourCount >= 1;
    return pairCount === 7;
}

function calculateFan(cardGroups) {
    const fanDef = fanDefinitions[currentRule];
    let baseTotal = 0;
    let specialTotal = 0;
    let details = [];
    let hasQiDui = checkQiDui(cardGroups);

    if (hasQiDui) {
        if (window.isLongQiDui) {
            baseTotal += fanDef.longqidui.fan;
            details.push({...fanDef.longqidui});
        } else {
            baseTotal += fanDef.qidui.fan;
            details.push({...fanDef.qidui});
        }
    } else {
        if (checkQingYiSe(cardGroups)) {
            baseTotal += fanDef.qingyise.fan;
            details.push({...fanDef.qingyise});
        } else if (checkHunYiSe(cardGroups)) {
            baseTotal += fanDef.hunyise.fan;
            details.push({...fanDef.hunyise});
        }

        if (checkPengPengHu(cardGroups)) {
            baseTotal += fanDef.pengpenghu.fan;
            details.push({...fanDef.pengpenghu});
        }

        if (checkDuanYaoJiu(cardGroups)) {
            baseTotal += fanDef.duanyaojiu.fan;
            details.push({...fanDef.duanyaojiu});
        }

        baseTotal += fanDef.pinghu.fan;
        details.push({...fanDef.pinghu});
    }

    specialTotal += fanDef.gangshanghua.fan;
    details.push({...fanDef.gangshanghua});
    specialTotal += fanDef.haidilaoyue.fan;
    details.push({...fanDef.haidilaoyue});

    if (currentRule === 'guangdong' && !hasQiDui) {
        baseTotal += fanDef.zimojia.fan;
        details.push({...fanDef.zimojia});
    }