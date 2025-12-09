import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePOAttainment } from '@/lib/services/attainment-calculator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseClassId } = await params;
    const supabase = await createClient();

    try {
        const { data: assignment } = await supabase
            .from('course_class_assignments')
            .select(`
        *,
        courses(*),
        classes(*, branches(*))
      `)
            .eq('id', courseClassId)
            .single();

        if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

        const { data: attainmentResults } = await supabase
            .from('co_attainment_results')
            .select(`
        *,
        course_outcomes(id, co_number, description)
      `)
            .eq('course_class_assignment_id', courseClassId);

        const weights: Record<string, number> = {
            'SEE': 0.5,
            'CIE-I': 0.2,
            'CIE-II': 0.2,
            'Assignment-I': 0.05,
            'Assignment-II': 0.05,
            'CIE-III': 0, 
        };

        const coMap = new Map<string, {
            co_number: string;
            description: string;
            weightedSum: number;
            totalWeight: number;
            assessments: string[];
        }>();

        attainmentResults?.forEach((res: any) => {
            if (!res.course_outcomes) return;
            
            const coData = Array.isArray(res.course_outcomes) 
                ? res.course_outcomes[0] 
                : res.course_outcomes;
                
            if(!coData) return;

            const coId = res.course_outcome_id;
            const type = res.assessment_type;
            
            let weight = weights[type] || 0;
            
            if(type === 'Assignment') weight = 0.05; 

            if (!coMap.has(coId)) {
                coMap.set(coId, {
                    co_number: coData.co_number,
                    description: coData.description,
                    weightedSum: 0,
                    totalWeight: 0,
                    assessments: []
                });
            }

            const entry = coMap.get(coId)!;
            
            if (res.attainment_level !== null) {
                entry.weightedSum += (res.attainment_level * weight);
                entry.totalWeight += weight;
                entry.assessments.push(`${type} (${res.attainment_level})`);
            }
        });

        const finalCoAttainment = Array.from(coMap.entries()).map(([coId, data]) => {
            const finalLevel = data.totalWeight > 0 
                ? data.weightedSum / data.totalWeight 
                : 0;

            return {
                co_id: coId,
                co_number: data.co_number,
                description: data.description,
                attainment_level: Number(finalLevel.toFixed(2)),
                assessment_count: data.assessments.length
            };
        }).sort((a, b) => a.co_number.localeCompare(b.co_number));

        const { data: mappings } = await supabase
            .from('co_po_mappings')
            .select(`
        course_outcome_id,
        mapping_strength,
        program_outcomes(id, po_number, description)
      `)
            .in('course_outcome_id', Array.from(coMap.keys()));

        type PoMapping = {
            co_id: string;
            po_id: string;
            po_number: string;
            po_description: string;
            strength: number;
        };

        const flatMappings: PoMapping[] = (mappings?.map((m: any) => {
            const po = Array.isArray(m.program_outcomes)
                ? m.program_outcomes[0]
                : m.program_outcomes;

            if (!po) return null;

            return {
                co_id: m.course_outcome_id,
                po_id: po.id,
                po_number: po.po_number,
                po_description: po.description,
                strength: Number(m.mapping_strength ?? 0)
            } as PoMapping;
        }) ?? []).filter((p): p is PoMapping => p !== null);

        const coResultsForPO = finalCoAttainment.map(co => ({
            coid: co.co_id,
            conumber: co.co_number,
            attainmentlevel: co.attainment_level
        }));

        const mappingsForPO = flatMappings.map(m => ({
            coid: m.co_id,
            poid: m.po_id,
            ponumber: m.po_number,
            podescription: m.po_description,
            strength: m.strength
        }));

        const finalPoAttainment = calculatePOAttainment(coResultsForPO, mappingsForPO);

        return NextResponse.json({
            course: assignment.courses,
            class: assignment.classes,
            co_attainment: finalCoAttainment,
            po_attainment: finalPoAttainment
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}