// ==================== UNIT CONVERTER MODULE ====================
export const UnitConverter = {
    // ==================== DOM ELEMENTS ====================
    dom: {},

    // ==================== UNIT DATA ====================
    units: {
        length: {
            meter: { name: 'متر', symbol: 'm', factor: 1 },
            centimeter: { name: 'سنتيمتر', symbol: 'cm', factor: 0.01 },
            kilometer: { name: 'كيلومتر', symbol: 'km', factor: 1000 },
            millimeter: { name: 'ميليمتر', symbol: 'mm', factor: 0.001 },
            micrometer: { name: 'ميكرومتر', symbol: 'μm', factor: 0.000001 },
            nanometer: { name: 'نانومتر', symbol: 'nm', factor: 0.000000001 },
            mile: { name: 'ميل', symbol: 'mi', factor: 1609.344 },
            yard: { name: 'ياردة', symbol: 'yd', factor: 0.9144 },
            foot: { name: 'قدم', symbol: 'ft', factor: 0.3048 },
            inch: { name: 'إنش', symbol: 'in', factor: 0.0254 },
            nautical_mile: { name: 'ميل بحري', symbol: 'nmi', factor: 1852 },
            light_year: { name: 'سنة ضوئية', symbol: 'ly', factor: 9460730472580800 }
        },
        mass: {
            kilogram: { name: 'كيلوغرام', symbol: 'kg', factor: 1 },
            gram: { name: 'غرام', symbol: 'g', factor: 0.001 },
            milligram: { name: 'ميليغرام', symbol: 'mg', factor: 0.000001 },
            microgram: { name: 'ميكروغرام', symbol: 'μg', factor: 0.000000001 },
            metric_ton: { name: 'طن متري', symbol: 't', factor: 1000 },
            pound: { name: 'رطل', symbol: 'lb', factor: 0.453592 },
            ounce: { name: 'أونصة', symbol: 'oz', factor: 0.0283495 },
            stone: { name: 'ستون', symbol: 'st', factor: 6.35029 },
            carat: { name: 'قيراط', symbol: 'ct', factor: 0.0002 },
            grain: { name: 'غرين', symbol: 'gr', factor: 0.0000647989 }
        },
        time: {
            second: { name: 'ثانية', symbol: 's', factor: 1 },
            millisecond: { name: 'ميلي ثانية', symbol: 'ms', factor: 0.001 },
            microsecond: { name: 'ميكرو ثانية', symbol: 'μs', factor: 0.000001 },
            nanosecond: { name: 'نانو ثانية', symbol: 'ns', factor: 0.000000001 },
            minute: { name: 'دقيقة', symbol: 'min', factor: 60 },
            hour: { name: 'ساعة', symbol: 'h', factor: 3600 },
            day: { name: 'يوم', symbol: 'd', factor: 86400 },
            week: { name: 'أسبوع', symbol: 'wk', factor: 604800 },
            month: { name: 'شهر', symbol: 'mo', factor: 2629746 },
            year: { name: 'سنة', symbol: 'yr', factor: 31556952 },
            decade: { name: 'عقد', symbol: 'dec', factor: 315569520 },
            century: { name: 'قرن', symbol: 'cent', factor: 3155695200 }
        },
        energy: {
            joule: { name: 'جول', symbol: 'J', factor: 1 },
            kilojoule: { name: 'كيلو جول', symbol: 'kJ', factor: 1000 },
            calorie: { name: 'سعرة حرارية', symbol: 'cal', factor: 4.184 },
            kilocalorie: { name: 'كيلو سعرة', symbol: 'kcal', factor: 4184 },
            watt_hour: { name: 'وات ساعة', symbol: 'Wh', factor: 3600 },
            kilowatt_hour: { name: 'كيلو وات ساعة', symbol: 'kWh', factor: 3600000 },
            electronvolt: { name: 'إلكترون فولت', symbol: 'eV', factor: 1.602176634e-19 },
            foot_pound: { name: 'قدم-رطل', symbol: 'ft⋅lb', factor: 1.355818 },
            british_thermal_unit: { name: 'وحدة حرارية بريطانية', symbol: 'BTU', factor: 1055.06 }
        },
        pressure: {
            pascal: { name: 'باسكال', symbol: 'Pa', factor: 1 },
            kilopascal: { name: 'كيلو باسكال', symbol: 'kPa', factor: 1000 },
            megapascal: { name: 'ميغا باسكال', symbol: 'MPa', factor: 1000000 },
            bar: { name: 'بار', symbol: 'bar', factor: 100000 },
            millibar: { name: 'ميلي بار', symbol: 'mbar', factor: 100 },
            atmosphere: { name: 'أتموسفير', symbol: 'atm', factor: 101325 },
            torr: { name: 'تور', symbol: 'Torr', factor: 133.322 },
            millimeter_mercury: { name: 'ميليمتر زئبق', symbol: 'mmHg', factor: 133.322 },
            pound_per_square_inch: { name: 'رطل لكل إنش مربع', symbol: 'psi', factor: 6894.76 }
        },
        temperature: {
            celsius: { name: 'درجة مئوية', symbol: '°C', factor: 1 },
            fahrenheit: { name: 'فهرنهايت', symbol: '°F', factor: 1 },
            kelvin: { name: 'كلفن', symbol: 'K', factor: 1 },
            rankine: { name: 'رانكين', symbol: '°R', factor: 1 }
        },
        area: {
            square_meter: { name: 'متر مربع', symbol: 'm²', factor: 1 },
            square_kilometer: { name: 'كيلومتر مربع', symbol: 'km²', factor: 1000000 },
            square_centimeter: { name: 'سنتيمتر مربع', symbol: 'cm²', factor: 0.0001 },
            square_millimeter: { name: 'ميليمتر مربع', symbol: 'mm²', factor: 0.000001 },
            hectare: { name: 'هكتار', symbol: 'ha', factor: 10000 },
            acre: { name: 'فدان', symbol: 'ac', factor: 4046.86 },
            square_foot: { name: 'قدم مربع', symbol: 'ft²', factor: 0.092903 },
            square_inch: { name: 'إنش مربع', symbol: 'in²', factor: 0.00064516 },
            square_yard: { name: 'ياردة مربعة', symbol: 'yd²', factor: 0.836127 },
            square_mile: { name: 'ميل مربع', symbol: 'mi²', factor: 2589988.11 }
        },
        volume: {
            cubic_meter: { name: 'متر مكعب', symbol: 'm³', factor: 1 },
            liter: { name: 'لتر', symbol: 'L', factor: 0.001 },
            milliliter: { name: 'ميلي لتر', symbol: 'mL', factor: 0.000001 },
            cubic_centimeter: { name: 'سنتيمتر مكعب', symbol: 'cm³', factor: 0.000001 },
            cubic_millimeter: { name: 'ميليمتر مكعب', symbol: 'mm³', factor: 0.000000001 },
            cubic_foot: { name: 'قدم مكعب', symbol: 'ft³', factor: 0.0283168 },
            cubic_inch: { name: 'إنش مكعب', symbol: 'in³', factor: 0.0000163871 },
            cubic_yard: { name: 'ياردة مكعبة', symbol: 'yd³', factor: 0.764555 },
            gallon_us: { name: 'غالون أمريكي', symbol: 'gal (US)', factor: 0.00378541 },
            quart_us: { name: 'كوارت أمريكي', symbol: 'qt (US)', factor: 0.000946353 },
            pint_us: { name: 'باينت أمريكي', symbol: 'pt (US)', factor: 0.000473176 },
            cup_us: { name: 'كوب أمريكي', symbol: 'cup (US)', factor: 0.000236588 },
            fluid_ounce_us: { name: 'أونصة سائلة أمريكية', symbol: 'fl oz (US)', factor: 0.0000295735 }
        },
        speed: {
            meter_per_second: { name: 'متر/ثانية', symbol: 'm/s', factor: 1 },
            kilometer_per_hour: { name: 'كيلومتر/ساعة', symbol: 'km/h', factor: 0.277778 },
            mile_per_hour: { name: 'ميل/ساعة', symbol: 'mph', factor: 0.44704 },
            foot_per_second: { name: 'قدم/ثانية', symbol: 'ft/s', factor: 0.3048 },
            knot: { name: 'عقدة', symbol: 'kn', factor: 0.514444 },
            mach: { name: 'ماخ', symbol: 'Ma', factor: 343 },
            speed_of_light: { name: 'سرعة الضوء', symbol: 'c', factor: 299792458 }
        },
        frequency: {
            hertz: { name: 'هرتز', symbol: 'Hz', factor: 1 },
            kilohertz: { name: 'كيلو هرتز', symbol: 'kHz', factor: 1000 },
            megahertz: { name: 'ميغا هرتز', symbol: 'MHz', factor: 1000000 },
            gigahertz: { name: 'غيغا هرتز', symbol: 'GHz', factor: 1000000000 },
            terahertz: { name: 'تيرا هرتز', symbol: 'THz', factor: 1000000000000 }
        }
    },

    // ==================== INITIALIZATION ====================
    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.loadCategory('length'); // Load default category
        console.log('✅ Unit Converter initialized');
    },

    // ==================== DOM CACHE ====================
    cacheDOMElements() {
        this.dom = {
            modal: document.getElementById('unit-converter-modal'),
            categorySelect: document.getElementById('unit-category-select'),
            fromValue: document.getElementById('from-value'),
            fromUnit: document.getElementById('from-unit'),
            toValue: document.getElementById('to-value'),
            toUnit: document.getElementById('to-unit'),
            swapBtn: document.getElementById('swap-units-btn'),
            sendBtn: document.getElementById('send-conversion-btn'),
            conversionResults: document.getElementById('conversion-results'),
            commonConversions: document.getElementById('common-conversions')
        };
    },

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Category change
        this.dom.categorySelect.addEventListener('change', (e) => {
            this.loadCategory(e.target.value);
        });

        // Value input
        this.dom.fromValue.addEventListener('input', () => {
            this.convert();
        });

        // Unit changes
        this.dom.fromUnit.addEventListener('change', () => {
            this.convert();
        });

        this.dom.toUnit.addEventListener('change', () => {
            this.convert();
        });

        // Swap units
        this.dom.swapBtn.addEventListener('click', () => {
            this.swapUnits();
        });

        // Send to chat
        this.dom.sendBtn.addEventListener('click', () => {
            this.sendToChat();
        });
    },

    // ==================== CATEGORY LOADING ====================
    loadCategory(category) {
        const categoryData = this.units[category];
        if (!categoryData) return;

        // Clear existing options
        this.dom.fromUnit.innerHTML = '';
        this.dom.toUnit.innerHTML = '';

        // Add new options
        Object.entries(categoryData).forEach(([key, unit]) => {
            const option1 = new Option(`${unit.name} (${unit.symbol})`, key);
            const option2 = new Option(`${unit.name} (${unit.symbol})`, key);

            this.dom.fromUnit.appendChild(option1);
            this.dom.toUnit.appendChild(option2);
        });

        // Set default selections
        this.dom.fromUnit.value = Object.keys(categoryData)[0];
        this.dom.toUnit.value = Object.keys(categoryData)[1] || Object.keys(categoryData)[0];

        // Clear values
        this.dom.fromValue.value = '';
        this.dom.toValue.value = '';

        // Hide results
        this.dom.conversionResults.style.display = 'none';
    },

    // ==================== CONVERSION LOGIC ====================
    convert() {
        const fromValue = parseFloat(this.dom.fromValue.value);
        const fromUnit = this.dom.fromUnit.value;
        const toUnit = this.dom.toUnit.value;
        const category = this.dom.categorySelect.value;

        if (isNaN(fromValue) || !fromUnit || !toUnit) {
            this.dom.toValue.value = '';
            this.dom.conversionResults.style.display = 'none';
            return;
        }

        let result;
        if (category === 'temperature') {
            result = this.convertTemperature(fromValue, fromUnit, toUnit);
        } else {
            result = this.convertStandard(fromValue, fromUnit, toUnit, category);
        }

        this.dom.toValue.value = this.formatResult(result);
        this.showCommonConversions(fromValue, fromUnit, category);
    },

    convertStandard(value, fromUnit, toUnit, category) {
        const fromFactor = this.units[category][fromUnit].factor;
        const toFactor = this.units[category][toUnit].factor;

        // Convert to base unit, then to target unit
        const baseValue = value * fromFactor;
        return baseValue / toFactor;
    },

    convertTemperature(value, fromUnit, toUnit) {
        let celsius;

        // Convert to Celsius first
        switch (fromUnit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5/9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
            case 'rankine':
                celsius = (value - 491.67) * 5/9;
                break;
        }

        // Convert from Celsius to target unit
        switch (toUnit) {
            case 'celsius':
                return celsius;
            case 'fahrenheit':
                return celsius * 9/5 + 32;
            case 'kelvin':
                return celsius + 273.15;
            case 'rankine':
                return (celsius + 273.15) * 9/5;
        }
    },

    formatResult(value) {
        if (Math.abs(value) < 0.000001 && value !== 0) {
            return value.toExponential(6);
        } else if (Math.abs(value) > 1000000) {
            return value.toExponential(6);
        } else {
            return value.toFixed(6).replace(/\.?0+$/, '');
        }
    },

    // ==================== SWAP UNITS ====================
    swapUnits() {
        const tempUnit = this.dom.fromUnit.value;
        const tempValue = this.dom.fromValue.value;

        this.dom.fromUnit.value = this.dom.toUnit.value;
        this.dom.toUnit.value = tempUnit;

        this.dom.fromValue.value = this.dom.toValue.value;
        this.dom.toValue.value = tempValue;

        this.convert();
    },

    // ==================== COMMON CONVERSIONS ====================
    showCommonConversions(value, fromUnit, category) {
        if (!value || category === 'temperature') {
            this.dom.conversionResults.style.display = 'none';
            return;
        }

        const categoryData = this.units[category];
        const fromUnitData = categoryData[fromUnit];
        const commonUnits = Object.keys(categoryData).slice(0, 4); // First 4 units

        this.dom.commonConversions.innerHTML = '';

        commonUnits.forEach(unitKey => {
            if (unitKey === fromUnit) return;

            const unitData = categoryData[unitKey];
            const convertedValue = this.convertStandard(value, fromUnit, unitKey, category);

            const div = document.createElement('div');
            div.style.cssText = 'padding: 8px; background: var(--bg-input-area); border-radius: 6px; margin-bottom: 4px; font-size: 14px;';
            div.textContent = `${this.formatResult(convertedValue)} ${unitData.symbol}`;

            this.dom.commonConversions.appendChild(div);
        });

        this.dom.conversionResults.style.display = 'block';
    },

    // ==================== SEND TO CHAT ====================
    sendToChat() {
        const fromValue = this.dom.fromValue.value;
        const fromUnit = this.dom.fromUnit.value;
        const toValue = this.dom.toValue.value;
        const toUnit = this.dom.toUnit.value;
        const category = this.dom.categorySelect.value;

        if (!fromValue || !toValue) {
            MathApp.ui.showToast('⚠️ يرجى إدخال قيمة للتحويل أولاً', true);
            return;
        }

        const fromUnitData = this.units[category][fromUnit];
        const toUnitData = this.units[category][toUnit];

        const displayText = `🔄 تحويل الوحدات: ${fromValue} ${fromUnitData.symbol} = ${toValue} ${toUnitData.symbol} (من ${fromUnitData.name} إلى ${toUnitData.name})`;

        MathApp.chat.send({
            type: 'structured_problem',
            tool: 'unit_converter',
            value: fromValue,
            fromUnit,
            toUnit,
            category,
            displayText
        });

        this.close();
        MathApp.ui.showToast('✅ تم إرسال التحويل للمستشار');
    },

    // ==================== MODAL CONTROLS ====================
    open() {
        this.dom.modal.style.display = 'block';
        this.dom.fromValue.focus();
    },

    close() {
        this.dom.modal.style.display = 'none';
    }
};
