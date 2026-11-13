import { AlgebraWorkspace } from './workspace/algebraWorkspace.js';
import { CalculusWorkspace } from './workspace/calculusWorkspace.js';
import { GeometryWorkspace } from './workspace/geometryWorkspace.js';
import { MatrixWorkspace } from './workspace/matrixWorkspace.js';
import { StatisticsWorkspace } from './workspace/statisticsWorkspace.js';

// وحدة تصدير وتهيئة الوركسبيس بشكل مستقل
export const workSpaceModule = {
    AlgebraWorkspace,
    CalculusWorkspace,
    GeometryWorkspace,
    MatrixWorkspace,
    StatisticsWorkspace,
    
    // دالة تهيئة جميع الوركسبيس
    init(mathAppContext) {
        try {
            console.log('Starting workspaces initialization...');
            
            if (!this.GeometryWorkspace) throw new Error('GeometryWorkspace is undefined');
            console.log('✓ GeometryWorkspace initializing...');
            this.GeometryWorkspace.init();
            console.log('✓ GeometryWorkspace initialized');
            
            if (!this.MatrixWorkspace) throw new Error('MatrixWorkspace is undefined');
            console.log('✓ MatrixWorkspace initializing...');
            this.MatrixWorkspace.init();
            console.log('✓ MatrixWorkspace initialized');
            
            if (!this.CalculusWorkspace) throw new Error('CalculusWorkspace is undefined');
            console.log('✓ CalculusWorkspace initializing...');
            this.CalculusWorkspace.init();
            console.log('✓ CalculusWorkspace initialized');
            
            if (!this.StatisticsWorkspace) throw new Error('StatisticsWorkspace is undefined');
            console.log('✓ StatisticsWorkspace initializing...');
            this.StatisticsWorkspace.init();
            console.log('✓ StatisticsWorkspace initialized');
            
            if (!this.AlgebraWorkspace) throw new Error('AlgebraWorkspace is undefined');
            console.log('✓ AlgebraWorkspace initializing...');
            this.AlgebraWorkspace.init();
            console.log('✓ AlgebraWorkspace initialized');
            
            console.log('✓ All workspaces initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing workspaces:', error);
            throw error;
        }
    }
};

// تصدير كل وركسبيس على حدة للوصول المباشر
export {
    AlgebraWorkspace,
    CalculusWorkspace,
    GeometryWorkspace,
    MatrixWorkspace,
    StatisticsWorkspace
};