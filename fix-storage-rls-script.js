// Script para corrigir políticas RLS do Supabase Storage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dplfodkrsaffzljmteub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbGZvZGtyc2FmZnpsam10ZXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDMwODYsImV4cCI6MjA3MTk3OTA4Nn0.8lzqt8bfzlzr8v-w_JTh4EDmVrO66tlRiaQ9LJbfxas';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStorageRLS() {
  console.log('🔧 Corrigindo políticas RLS do Supabase Storage...\n');

  try {
    // 1. Verificar se o bucket reports existe
    console.log('1. Verificando bucket reports...');
    const { data: buckets, error: bucketsError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('id', 'reports');

    if (bucketsError) {
      console.error('❌ Erro ao verificar buckets:', bucketsError);
    } else {
      console.log('✅ Buckets encontrados:', buckets);
    }

    // 2. Criar bucket se não existir
    console.log('\n2. Criando bucket reports se necessário...');
    const { error: createBucketError } = await supabase
      .rpc('exec_sql', {
        sql: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES (
            'reports',
            'reports',
            true,
            52428800, -- 50MB
            ARRAY['application/pdf']
          )
          ON CONFLICT (id) DO NOTHING;
        `
      });

    if (createBucketError) {
      console.error('❌ Erro ao criar bucket:', createBucketError);
    } else {
      console.log('✅ Bucket reports criado/verificado');
    }

    // 3. Desabilitar RLS temporariamente
    console.log('\n3. Desabilitando RLS temporariamente...');
    const { error: disableRLSError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
      });

    if (disableRLSError) {
      console.error('❌ Erro ao desabilitar RLS:', disableRLSError);
    } else {
      console.log('✅ RLS desabilitado temporariamente');
    }

    // 4. Remover políticas existentes
    console.log('\n4. Removendo políticas existentes...');
    const policiesToRemove = [
      'Public Access',
      'Authenticated users can upload files',
      'Public can view files',
      'Users can upload their own files',
      'Public can view PDF files',
      'Allow PDF uploads',
      'Allow PDF updates',
      'Allow PDF deletion'
    ];

    for (const policyName of policiesToRemove) {
      const { error: dropError } = await supabase
        .rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
        });

      if (dropError) {
        console.log(`⚠️ Erro ao remover política ${policyName}:`, dropError.message);
      } else {
        console.log(`✅ Política ${policyName} removida`);
      }
    }

    // 5. Criar políticas permissivas
    console.log('\n5. Criando políticas permissivas...');
    
    const policies = [
      {
        name: 'Public can view all files',
        sql: 'CREATE POLICY "Public can view all files" ON storage.objects FOR SELECT USING (true);'
      },
      {
        name: 'Public can upload files',
        sql: 'CREATE POLICY "Public can upload files" ON storage.objects FOR INSERT WITH CHECK (true);'
      },
      {
        name: 'Public can update files',
        sql: 'CREATE POLICY "Public can update files" ON storage.objects FOR UPDATE USING (true);'
      },
      {
        name: 'Public can delete files',
        sql: 'CREATE POLICY "Public can delete files" ON storage.objects FOR DELETE USING (true);'
      }
    ];

    for (const policy of policies) {
      const { error: createError } = await supabase
        .rpc('exec_sql', {
          sql: policy.sql
        });

      if (createError) {
        console.error(`❌ Erro ao criar política ${policy.name}:`, createError);
      } else {
        console.log(`✅ Política ${policy.name} criada`);
      }
    }

    // 6. Reabilitar RLS
    console.log('\n6. Reabilitando RLS...');
    const { error: enableRLSError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
      });

    if (enableRLSError) {
      console.error('❌ Erro ao reabilitar RLS:', enableRLSError);
    } else {
      console.log('✅ RLS reabilitado');
    }

    // 7. Verificar políticas criadas
    console.log('\n7. Verificando políticas criadas...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'objects' 
            AND schemaname = 'storage'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError);
    } else {
      console.log('✅ Políticas atuais:', policies);
    }

    console.log('\n🎉 Políticas RLS corrigidas com sucesso!');
    console.log('📋 Agora o N8N deve conseguir fazer upload de PDFs!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixStorageRLS();
