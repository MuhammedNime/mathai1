import { analysisData } from './modules/analysis.js';
import { logicData } from './modules/logic.js';
import { foundationsData } from './modules/foundations.js';
import { algebraData } from './modules/algebra.js';
import { algebraData1 } from './modules/algebra1.js';
import { algebraData2 } from './modules/algebra2.js';
import { historyData } from './modules/history.js';
import { aiMathData } from './modules/ai_math.js';
import { chaosData} from './modules/chaos.js'; 
import { quantityData } from './modules/quantity.js';
import { structureData } from './modules/structure.js';
import { spaceData } from './modules/space.js';
import { changeData } from './modules/change.js';
import { appliedData } from './modules/applied.js'; 
import { physicsData } from './modules/physics_math.js'; 
import { financialData } from './modules/financial_math.js'; 


// دمج الكل في مصفوفة واحدة ضخمة
export const libraryData = [
    ...analysisData,
    ...foundationsData,
    ...algebraData,
    ...algebraData1,
    ...algebraData2,
    ...historyData,
    ...aiMathData,
    ...chaosData,
    ...quantityData,
    ...structureData,
    ...spaceData,
    ...changeData,
    ...appliedData,
    ...physicsData,
    ...logicData,
    ...financialData
];