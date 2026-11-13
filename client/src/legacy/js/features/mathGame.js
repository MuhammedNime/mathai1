// js/features/mathGame.js
export const MathGame = {
    state: {
        score: 0,
        timeLeft: 30,
        timerInterval: null,
        currentQuestion: null,
        isPlaying: false
    },
    
    // إنشاء واجهة اللعبة ديناميكياً (لتوفير تعديل HTML)
    createUI() {
        const modalHtml = `
        <div class="app-modal" id="game-modal" style="display:none;">
            <div class="modal-content" style="text-align:center; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white;">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <span style="font-size:20px;">🏆 النقاط: <b id="game-score">0</b></span>
                    <span style="font-size:20px;">⏰ الوقت: <b id="game-timer">30</b></span>
                </div>
                
                <div id="game-question-box" style="font-size: 40px; margin: 30px 0; font-weight: bold; min-height:60px;">
                    جاهز؟
                </div>
                
                <div id="game-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <!-- الخيارات ستظهر هنا -->
                </div>

                <button id="start-game-btn" class="btn" style="background:#4CAF50; color:white; width:100%; margin-top:20px; font-size:18px;">ابدأ التحدي</button>
                <button class="modal-close-btn" style="position:absolute; top:10px; left:10px; color:white;">&times;</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // ربط الأحداث
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.querySelector('#game-modal .modal-close-btn').addEventListener('click', () => this.close());
    },

    open() {
        if (!document.getElementById('game-modal')) this.createUI();
        document.getElementById('game-modal').style.display = 'block';
    },

    close() {
        this.stopGame();
        document.getElementById('game-modal').style.display = 'none';
    },

    startGame() {
        this.state.score = 0;
        this.state.timeLeft = 30;
        this.state.isPlaying = true;
        document.getElementById('start-game-btn').style.display = 'none';
        document.getElementById('game-score').innerText = 0;
        
        this.nextQuestion();
        this.startTimer();
    },

    stopGame() {
        this.state.isPlaying = false;
        clearInterval(this.state.timerInterval);
        document.getElementById('start-game-btn').style.display = 'block';
        document.getElementById('start-game-btn').innerText = 'العب مجدداً';
        document.getElementById('game-question-box').innerHTML = `انتهى الوقت! <br> النتيجة: ${this.state.score}`;
        document.getElementById('game-options').innerHTML = '';
    },

    startTimer() {
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            document.getElementById('game-timer').innerText = this.state.timeLeft;
            if (this.state.timeLeft <= 0) this.stopGame();
        }, 1000);
    },

    nextQuestion() {
        if (!this.state.isPlaying) return;

        // توليد سؤال عشوائي (جمع، ضرب، طرح)
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        const n1 = Math.floor(Math.random() * 12) + 1;
        const n2 = Math.floor(Math.random() * 12) + 1;
        
        let ans;
        if (op === '+') ans = n1 + n2;
        else if (op === '-') ans = n1 - n2;
        else ans = n1 * n2;

        this.state.currentQuestion = { text: `${n1} ${op} ${n2} = ?`, answer: ans };
        document.getElementById('game-question-box').innerText = this.state.currentQuestion.text;

        // توليد خيارات (1 صحيح و 3 خطأ)
        let options = [ans];
        while (options.length < 4) {
            let fake = ans + Math.floor(Math.random() * 10) - 5;
            if (fake !== ans && !options.includes(fake)) options.push(fake);
        }
        options.sort(() => Math.random() - 0.5); // خلط

        const optionsHtml = options.map(opt => 
            `<button class="game-opt-btn" onclick="MathApp.MathGame.checkAnswer(${opt})" style="padding:15px; font-size:20px; border:none; border-radius:10px; background:rgba(255,255,255,0.2); color:white; cursor:pointer;">${opt}</button>`
        ).join('');
        
        document.getElementById('game-options').innerHTML = optionsHtml;
    },

    checkAnswer(userAns) {
        if (!this.state.isPlaying) return;
        
        if (userAns === this.state.currentQuestion.answer) {
            this.state.score += 10;
            this.state.timeLeft += 2; // مكافأة وقت
            document.getElementById('game-score').innerText = this.state.score;
            // تأثير صوتي صحيح (يمكن إضافته)
            this.nextQuestion();
        } else {
            this.state.timeLeft -= 5; // عقوبة وقت
            // تأثير بصري للخطأ
            document.getElementById('game-question-box').style.color = '#ff6b6b';
            setTimeout(() => document.getElementById('game-question-box').style.color = 'white', 300);
        }
    }
};