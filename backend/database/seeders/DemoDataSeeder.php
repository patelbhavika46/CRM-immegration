<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Applicant;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    private int $adminId;
    private int $consultantId;
    private int $superAdminId;

    public function run(): void
    {
        $this->adminId      = User::where('email', 'admin@crm.local')->value('id');
        $this->consultantId = User::where('email', 'consultant@crm.local')->value('id');
        $this->superAdminId = User::where('email', 'superadmin@crm.local')->value('id');

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('activities')->truncate();
        DB::table('opportunities')->truncate();
        DB::table('applicants')->truncate();
        DB::table('clients')->truncate();
        DB::table('leads')->where('id', '>', 1)->delete();   // keep test lead
        DB::table('leads')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->seedLeads();
        $clients = $this->seedClients();
        $this->seedOpportunities($clients);
        $this->seedActivities($clients);
    }

    private function seedLeads(): void
    {
        $leads = [
            ['first_name' => 'Priya',     'last_name' => 'Sharma',    'email' => 'priya.sharma@gmail.com',     'phone' => '+14165550101', 'company' => null,                    'visa_interest' => 'express_entry',   'country_of_origin' => 'India',       'status' => 'new',          'source' => 'web',          'owner_id' => $this->consultantId],
            ['first_name' => 'Carlos',    'last_name' => 'Mendes',    'email' => 'carlos.mendes@email.com',    'phone' => '+14165550102', 'company' => null,                    'visa_interest' => 'work_permit',     'country_of_origin' => 'Brazil',      'status' => 'contacted',    'source' => 'referral',     'owner_id' => $this->consultantId],
            ['first_name' => 'Yuki',      'last_name' => 'Tanaka',    'email' => 'yuki.tanaka@company.jp',     'phone' => '+14165550103', 'company' => 'Tanaka Corp',           'visa_interest' => 'intra_company',   'country_of_origin' => 'Japan',       'status' => 'qualified',    'source' => 'cold_call',    'owner_id' => $this->adminId],
            ['first_name' => 'Amara',     'last_name' => 'Okonkwo',   'email' => 'amara.okonkwo@gmail.com',   'phone' => '+14165550104', 'company' => null,                    'visa_interest' => 'family_sponsorship','country_of_origin' => 'Nigeria',    'status' => 'new',          'source' => 'social_media', 'owner_id' => $this->consultantId],
            ['first_name' => 'Dmitri',    'last_name' => 'Volkov',    'email' => 'dvolkov@techstart.ru',       'phone' => '+14165550105', 'company' => 'TechStart LLC',         'visa_interest' => 'start_up_visa',   'country_of_origin' => 'Russia',      'status' => 'qualified',    'source' => 'event',        'owner_id' => $this->adminId],
            ['first_name' => 'Mei',       'last_name' => 'Chen',      'email' => 'mei.chen@outlook.com',      'phone' => '+14165550106', 'company' => null,                    'visa_interest' => 'student_permit',  'country_of_origin' => 'China',       'status' => 'contacted',    'source' => 'web',          'owner_id' => $this->consultantId],
            ['first_name' => 'Samuel',    'last_name' => 'Adeyemi',   'email' => 'samuel.a@business.ng',      'phone' => '+14165550107', 'company' => 'Lagos Exports Ltd',     'visa_interest' => 'investor_visa',   'country_of_origin' => 'Nigeria',     'status' => 'new',          'source' => 'referral',     'owner_id' => $this->adminId],
            ['first_name' => 'Sofia',     'last_name' => 'Andersen',  'email' => 'sofia.andersen@gmail.com',  'phone' => '+14165550108', 'company' => null,                    'visa_interest' => 'express_entry',   'country_of_origin' => 'Denmark',     'status' => 'disqualified', 'source' => 'web',          'owner_id' => $this->consultantId],
            ['first_name' => 'Raj',       'last_name' => 'Patel',     'email' => 'raj.patel@infosys.com',     'phone' => '+14165550109', 'company' => 'Infosys',               'visa_interest' => 'work_permit',     'country_of_origin' => 'India',       'status' => 'qualified',    'source' => 'cold_call',    'owner_id' => $this->consultantId],
            ['first_name' => 'Lena',      'last_name' => 'Fischer',   'email' => 'lena.fischer@web.de',       'phone' => '+14165550110', 'company' => null,                    'visa_interest' => 'express_entry',   'country_of_origin' => 'Germany',     'status' => 'contacted',    'source' => 'event',        'owner_id' => $this->adminId],
            ['first_name' => 'James',     'last_name' => 'Osei',      'email' => 'james.osei@gmail.com',      'phone' => '+14165550111', 'company' => null,                    'visa_interest' => 'refugee',         'country_of_origin' => 'Ghana',       'status' => 'new',          'source' => 'web',          'owner_id' => $this->consultantId],
            ['first_name' => 'Fatima',    'last_name' => 'Al-Rashid', 'email' => 'fatima.r@hotmail.com',      'phone' => '+14165550112', 'company' => null,                    'visa_interest' => 'spousal_sponsorship','country_of_origin' => 'UAE',      'status' => 'qualified',    'source' => 'referral',     'owner_id' => $this->adminId],
            ['first_name' => 'Tomasz',    'last_name' => 'Kowalski',  'email' => 'tkowalski@company.pl',      'phone' => '+14165550113', 'company' => 'Polish Builders Co',    'visa_interest' => 'lmia_work_permit','country_of_origin' => 'Poland',      'status' => 'new',          'source' => 'cold_call',    'owner_id' => $this->consultantId],
            ['first_name' => 'Ana',       'last_name' => 'Gutierrez', 'email' => 'ana.gutierrez@email.mx',    'phone' => '+14165550114', 'company' => null,                    'visa_interest' => 'open_work_permit','country_of_origin' => 'Mexico',      'status' => 'contacted',    'source' => 'social_media', 'owner_id' => $this->adminId],
            ['first_name' => 'Wei',       'last_name' => 'Zhang',     'email' => 'wei.zhang@enterprise.cn',   'phone' => '+14165550115', 'company' => 'Sino-Tech Enterprises', 'visa_interest' => 'investor_visa',   'country_of_origin' => 'China',       'status' => 'qualified',    'source' => 'event',        'owner_id' => $this->adminId],
        ];

        $now = now();
        foreach ($leads as $i => $lead) {
            Lead::create(array_merge($lead, [
                'created_by' => $lead['owner_id'],
                'created_at' => $now->clone()->subDays(90 - $i * 5),
                'updated_at' => $now->clone()->subDays(85 - $i * 4),
            ]));
        }
    }

    private function seedClients(): array
    {
        $consultant = $this->consultantId;
        $admin      = $this->adminId;

        $clientDefs = [
            [
                'name' => 'Nguyen Family',       'type' => 'individual',  'service_type' => 'pr_application',
                'case_status' => 'approved',      'country_of_origin' => 'Vietnam',  'country_of_destination' => 'Canada',
                'consultant_id' => $consultant,   'date_opened' => now()->subMonths(8)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Linh',  'last_name' => 'Nguyen', 'email' => 'linh.nguyen@gmail.com',  'phone' => '+14165560101', 'nationality' => 'Vietnamese', 'relationship' => 'primary', 'visa_type' => 'express_entry_pr', 'immigration_status' => 'approved', 'application_id' => 'IMM5669-2024-001', 'submission_date' => now()->subMonths(6)->toDateString()],
                    ['first_name' => 'Minh',  'last_name' => 'Nguyen', 'email' => 'minh.nguyen@gmail.com',  'phone' => '+14165560102', 'nationality' => 'Vietnamese', 'relationship' => 'spouse',   'visa_type' => 'express_entry_pr', 'immigration_status' => 'approved', 'application_id' => 'IMM5669-2024-001B'],
                ],
                'opportunity' => ['stage' => 'closed_won', 'amount' => 4500, 'probability' => 100],
            ],
            [
                'name' => 'Patel & Associates',   'type' => 'corporate',   'service_type' => 'work_permit',
                'case_status' => 'submitted',      'country_of_origin' => 'India',    'country_of_destination' => 'Canada',
                'consultant_id' => $admin,         'date_opened' => now()->subMonths(5)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Arjun',  'last_name' => 'Patel', 'email' => 'arjun.patel@patelandco.com', 'phone' => '+14165560201', 'nationality' => 'Indian', 'relationship' => 'primary', 'visa_type' => 'work_permit', 'immigration_status' => 'approved', 'application_id' => 'WP-2024-4821', 'submission_date' => now()->subMonths(3)->toDateString()],
                    ['first_name' => 'Priya',  'last_name' => 'Patel', 'email' => 'priya.patel@gmail.com',       'phone' => '+14165560202', 'nationality' => 'Indian', 'relationship' => 'spouse',   'visa_type' => 'work_permit',   'immigration_status' => 'awaiting_ita'],
                ],
                'opportunity' => ['stage' => 'negotiation', 'amount' => 8500, 'probability' => 75],
            ],
            [
                'name' => 'Kim Family',           'type' => 'family',      'service_type' => 'family_sponsorship',
                'case_status' => 'in_progress',   'country_of_origin' => 'South Korea', 'country_of_destination' => 'Canada',
                'consultant_id' => $consultant,   'date_opened' => now()->subMonths(3)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Soo-Jin', 'last_name' => 'Kim', 'email' => 'soojin.kim@gmail.com', 'phone' => '+14165560301', 'nationality' => 'South Korean', 'relationship' => 'primary', 'visa_type' => 'dependent', 'immigration_status' => 'biometrics_requested', 'application_id' => 'FC-2024-7734', 'submission_date' => now()->subMonths(2)->toDateString()],
                ],
                'opportunity' => ['stage' => 'proposal', 'amount' => 3200, 'probability' => 60],
            ],
            [
                'name' => 'Al-Farsi Holdings',    'type' => 'corporate',   'service_type' => 'visa_extension',
                'case_status' => 'new',            'country_of_origin' => 'UAE',       'country_of_destination' => 'Canada',
                'consultant_id' => $admin,         'date_opened' => now()->subMonths(1)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Omar',   'last_name' => 'Al-Farsi', 'email' => 'omar@alfarsiholdings.ae', 'phone' => '+97150556001', 'nationality' => 'Emirati',  'relationship' => 'primary', 'visa_type' => 'visitor_visa', 'immigration_status' => 'profile_created'],
                    ['first_name' => 'Nadia',  'last_name' => 'Al-Farsi', 'email' => 'nadia@alfarsiholdings.ae','phone' => '+97150556002', 'nationality' => 'Emirati',  'relationship' => 'spouse',   'visa_type' => 'visitor_visa', 'immigration_status' => 'profile_created'],
                ],
                'opportunity' => ['stage' => 'qualification', 'amount' => 25000, 'probability' => 40],
            ],
            [
                'name' => 'Okonkwo Family',       'type' => 'family',      'service_type' => 'refugee_claim',
                'case_status' => 'under_review',  'country_of_origin' => 'Nigeria',   'country_of_destination' => 'Canada',
                'consultant_id' => $consultant,   'date_opened' => now()->subMonths(6)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Chidi',  'last_name' => 'Okonkwo', 'email' => 'chidi.okonkwo@gmail.com', 'phone' => '+14165560501', 'nationality' => 'Nigerian', 'relationship' => 'primary', 'visa_type' => 'other', 'immigration_status' => 'application_submitted', 'application_id' => 'RPD-2024-0093', 'submission_date' => now()->subMonths(5)->toDateString()],
                    ['first_name' => 'Adaeze', 'last_name' => 'Okonkwo', 'email' => null,                       'phone' => null,           'nationality' => 'Nigerian', 'relationship' => 'child',   'visa_type' => 'dependent',    'immigration_status' => 'application_submitted'],
                ],
                'opportunity' => ['stage' => 'proposal', 'amount' => 3800, 'probability' => 55],
            ],
            [
                'name' => 'Fischer Tech',          'type' => 'corporate',   'service_type' => 'work_permit',
                'case_status' => 'approved',        'country_of_origin' => 'Germany',   'country_of_destination' => 'Canada',
                'consultant_id' => $admin,          'date_opened' => now()->subMonths(4)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Klaus',  'last_name' => 'Fischer', 'email' => 'k.fischer@fischertech.de', 'phone' => '+4930556001', 'nationality' => 'German', 'relationship' => 'primary', 'visa_type' => 'work_permit', 'immigration_status' => 'approved', 'application_id' => 'ICT-2024-5512', 'submission_date' => now()->subMonths(3)->toDateString()],
                ],
                'opportunity' => ['stage' => 'closed_won', 'amount' => 5200, 'probability' => 100],
            ],
            [
                'name' => 'Rosario Family',       'type' => 'family',      'service_type' => 'pr_application',
                'case_status' => 'documents_pending', 'country_of_origin' => 'Philippines', 'country_of_destination' => 'Canada',
                'consultant_id' => $consultant,   'date_opened' => now()->subMonths(2)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Maria',  'last_name' => 'Rosario', 'email' => 'maria.rosario@gmail.com', 'phone' => '+6325559001', 'nationality' => 'Filipino',  'relationship' => 'primary', 'visa_type' => 'express_entry_pr', 'immigration_status' => 'application_submitted', 'application_id' => 'EE-2024-9981', 'submission_date' => now()->subMonths(1)->toDateString()],
                    ['first_name' => 'Jose',   'last_name' => 'Rosario', 'email' => 'jose.rosario@gmail.com',  'phone' => '+6325559002', 'nationality' => 'Filipino',  'relationship' => 'spouse',   'visa_type' => 'express_entry_pr', 'immigration_status' => 'application_submitted'],
                    ['first_name' => 'Ana',    'last_name' => 'Rosario', 'email' => null,                      'phone' => null,           'nationality' => 'Filipino',  'relationship' => 'child',    'visa_type' => 'dependent',        'immigration_status' => 'application_submitted'],
                ],
                'opportunity' => ['stage' => 'negotiation', 'amount' => 6500, 'probability' => 70],
            ],
            [
                'name' => 'Volkov Ventures',       'type' => 'corporate',   'service_type' => 'other',
                'case_status' => 'new',             'country_of_origin' => 'Russia',    'country_of_destination' => 'Canada',
                'consultant_id' => $admin,          'date_opened' => now()->subWeeks(3)->toDateString(),
                'applicants' => [
                    ['first_name' => 'Dmitri', 'last_name' => 'Volkov', 'email' => 'dvolkov@volkovventures.ru', 'phone' => '+74952221000', 'nationality' => 'Russian', 'relationship' => 'primary', 'visa_type' => 'other', 'immigration_status' => 'profile_created'],
                ],
                'opportunity' => ['stage' => 'prospecting', 'amount' => 12000, 'probability' => 20],
            ],
        ];

        $clients = [];
        foreach ($clientDefs as $i => $def) {
            $client = Client::create([
                'name'                   => $def['name'],
                'type'                   => $def['type'],
                'service_type'           => $def['service_type'],
                'case_status'            => $def['case_status'],
                'case_reference'         => 'CRM-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'country_of_origin'      => $def['country_of_origin'],
                'country_of_destination' => $def['country_of_destination'],
                'consultant_id'          => $def['consultant_id'],
                'date_opened'            => $def['date_opened'],
                'created_by'             => $def['consultant_id'],
                'created_at'             => $def['date_opened'],
                'updated_at'             => now()->subDays($i),
            ]);

            $applicants = [];
            foreach ($def['applicants'] as $appDef) {
                $applicants[] = Applicant::create(array_merge($appDef, [
                    'client_id'  => $client->id,
                    'created_by' => $def['consultant_id'],
                    'created_at' => $def['date_opened'],
                    'updated_at' => now()->subDays($i),
                ]));
            }

            $clients[] = ['client' => $client, 'applicants' => $applicants, 'opportunity_def' => $def['opportunity'], 'consultant_id' => $def['consultant_id']];
        }

        return $clients;
    }

    private function seedOpportunities(array $clients): void
    {
        foreach ($clients as $c) {
            $client  = $c['client'];
            $primary = $c['applicants'][0];
            $def     = $c['opportunity_def'];

            $closedAt = in_array($def['stage'], ['closed_won', 'closed_lost']) ? now()->subDays(rand(5, 30)) : null;

            Opportunity::create([
                'name'        => $client->name . ' — ' . ucwords(str_replace('_', ' ', $client->service_type)),
                'client_id'   => $client->id,
                'applicant_id'=> $primary->id,
                'stage'       => $def['stage'],
                'amount'      => $def['amount'],
                'currency'    => 'CAD',
                'probability' => $def['probability'],
                'close_date'  => $closedAt ? $closedAt->toDateString() : now()->addMonths(rand(1, 4))->toDateString(),
                'owner_id'    => $c['consultant_id'],
                'lead_id'     => null,
                'created_by'  => $c['consultant_id'],
                'created_at'  => $client->date_opened,
                'updated_at'  => now()->subDays(rand(1, 10)),
            ]);
        }
    }

    private function seedActivities(array $clients): void
    {
        $types = ['client_call', 'email', 'meeting', 'document_request', 'gov_submission', 'internal_task', 'note'];
        $stages = ['intake', 'documents_collection', 'application_preparation', 'submission', 'waiting_decision', 'approval'];

        $templates = [
            'client_call'      => ['Initial consultation call', 'Follow-up call on document status', 'Client update call', 'Discuss IRCC response', 'Pre-submission review call'],
            'email'            => ['Document checklist sent', 'Application status update', 'Missing documents reminder', 'IRCC correspondence forwarded', 'Retainer agreement sent'],
            'meeting'          => ['In-person client meeting', 'Document signing meeting', 'Case review meeting', 'Strategy meeting'],
            'document_request' => ['Request passport copies', 'Request employment letter', 'Request bank statements', 'Request police certificate', 'Request education credentials'],
            'gov_submission'   => ['Submitted Express Entry profile', 'Filed LMIA application', 'Submitted sponsorship application', 'Filed work permit extension', 'Submitted refugee claim'],
            'internal_task'    => ['Review application draft', 'Prepare submission checklist', 'Internal case review', 'Update case notes'],
            'note'             => ['Case note added', 'Internal review note', 'Client feedback recorded'],
        ];

        $statuses = ['completed', 'completed', 'completed', 'pending', 'pending', 'cancelled'];

        foreach ($clients as $c) {
            $client = $c['client'];
            $count  = rand(3, 7);

            for ($j = 0; $j < $count; $j++) {
                $type   = $types[array_rand($types)];
                $subj   = $templates[$type][array_rand($templates[$type])];
                $status = $statuses[array_rand($statuses)];
                $dueDate = now()->subDays(rand(1, 60))->toDateString();
                $completedAt = $status === 'completed' ? now()->subDays(rand(1, 55)) : null;

                Activity::create([
                    'type'              => $type,
                    'subject'           => $subj,
                    'notes'             => "Activity for {$client->name}. Case ref: {$client->case_reference}.",
                    'outcome'           => $status === 'completed' ? 'Completed successfully.' : null,
                    'relatable_type'    => 'App\\Models\\Client',
                    'relatable_id'      => $client->id,
                    'due_date'          => $dueDate,
                    'due_time'          => '10:00:00',
                    'completed_at'      => $completedAt,
                    'status'            => $status,
                    'application_stage' => $stages[array_rand($stages)],
                    'assigned_to'       => $c['consultant_id'],
                    'created_by'        => $c['consultant_id'],
                    'created_at'        => now()->subDays($j * 8 + 2),
                    'updated_at'        => now()->subDays($j * 2),
                ]);
            }
        }
    }
}
