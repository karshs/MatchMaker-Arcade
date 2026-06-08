const fs = require('fs')
let content = fs.readFileSync('client/src/pages/CustomerDetailPage.jsx', 'utf8')

// 1. Fix cd-tabs squish
content = content.replace('<div className="cd-tabs">', '<div className="cd-tabs" style={{ flexShrink: 0 }}>')

// 2. Do the main replacement
const targetContent = `            {/* LEFT */}
            <div className="cd-left">

              {/* Background & Career */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Background &amp; Career</span>
                  <button className="cd-edit-btn" id="cd-edit-career"><span className="ms">edit</span></button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Professional</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv"><span className="cd-kv-key">Occupation</span><span className="cd-kv-val">{customer.occupation || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Education</span><span className="cd-kv-val">{customer.education || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Company</span><span className="cd-kv-val">{customer.company || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Income</span><span className="cd-kv-val">{customer.annual_income ? \`₹\${customer.annual_income.toLocaleString()}\` : '—'}</span></div>
                      </div>
                    </div>
                    <div>
                      <div className="cd-section-label">Family</div>
                      <div className="cd-kv-list">
                        <div className="cd-kv"><span className="cd-kv-key">Religion</span><span className="cd-kv-val">{customer.religion || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Caste</span><span className="cd-kv-val">{customer.caste || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Family Type</span><span className="cd-kv-val">{customer.family_type || '—'}</span></div>
                        <div className="cd-kv"><span className="cd-kv-key">Values</span><span className="cd-kv-val"><span className="cd-tag">{customer.family_values || '—'}</span></span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <span className="cd-card-title">Lifestyle &amp; Preferences</span>
                  <button className="cd-edit-btn" id="cd-edit-lifestyle"><span className="ms">edit</span></button>
                </div>
                <div className="cd-card-body">
                  <div className="cd-card-cols">
                    <div>
                      <div className="cd-section-label">Habits</div>
                      <div className="cd-habits-list">
                        {customer.diet && <span className="cd-habit-chip"><span className="ms">restaurant</span>{customer.diet}</span>}
                        {customer.smoking === false && <span className="cd-habit-chip"><span className="ms">smoke_free</span>Non-Smoker</span>}
                        {customer.smoking === true  && <span className="cd-habit-chip"><span className="ms">smoking_rooms</span>Smoker</span>}
                        {customer.drinking && <span className="cd-habit-chip"><span className="ms">liquor</span>{customer.drinking}</span>}
                        {customer.physical_activity && <span className="cd-habit-chip"><span className="ms">fitness_center</span>{customer.physical_activity}</span>}
                      </div>
                      {customer.marriage_timeline && <>
                        <div className="cd-section-label" style={{ marginTop: 12 }}>Future Plans</div>
                        <p className="cd-future-plans">Marriage timeline: {customer.marriage_timeline}. {customer.want_kids ? 'Wants kids.' : ''} {customer.open_to_relocate ? 'Open to relocate.' : ''}</p>
                      </>}
                    </div>
                    <div>
                      <div className="cd-section-label">Partner Preferences</div>
                      <div className="cd-pref-list">
                        {customer.pref_age_min && <div className="cd-pref-item"><span className="ms">check_circle</span>Age: {customer.pref_age_min}–{customer.pref_age_max}</div>}
                        {customer.pref_location && <div className="cd-pref-item"><span className="ms">check_circle</span>Location: {customer.pref_location}</div>}
                        {customer.deal_breakers?.length > 0 && customer.deal_breakers.map((db, i) => (
                          <div key={i} className="cd-pref-item deal-breaker"><span className="ms breaker">cancel</span>Deal Breaker: {db}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sent Matches */}
              <div>
                <div className="cd-matches-title">Sent Matches History</div>
                {sentMatch.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#777', padding: '8px 0' }}>No matches sent yet.</div>
                ) : sentMatch.map(m => (
                  <div key={m.id} className="cd-match-card">
                    <DefaultAvatar className="cd-match-photo" style={{ borderRadius: '6px' }} />
                    <div className="cd-match-info">
                      <div className="cd-match-top">
                        <div>
                          <div className="cd-match-name">{m.first_name} {m.last_name}</div>
                          <div className="cd-match-loc">{m.city} • {m.occupation}</div>
                        </div>
                        <span className={\`cd-match-chip \${m.status === 'Interested' ? 'interested' : 'rejected'}\`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="cd-match-meta">
                        {m.annual_income && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Income</span><span className="cd-match-meta-val">₹{m.annual_income.toLocaleString()}</span></div>}
                        {m.sent_at && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Sent</span><span className="cd-match-meta-val">{fmtDate(m.sent_at)}</span></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>`

const replacement = \`            {/* LEFT */}
            <div className="cd-left">

              {activeTab === 0 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Physical Attributes</span>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Gender</span><span className="cd-kv-val">{customer.gender || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Height</span><span className="cd-kv-val">{customer.height_cm ? \`\${customer.height_cm} cm\` : '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Complexion</span><span className="cd-kv-val">{customer.complexion || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Body Type</span><span className="cd-kv-val">{customer.body_type || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Background &amp; Career</span>
                      <button className="cd-edit-btn" id="cd-edit-career"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Professional</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Occupation</span><span className="cd-kv-val">{customer.occupation || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Company</span><span className="cd-kv-val">{customer.company || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Income</span><span className="cd-kv-val">{customer.annual_income ? \`₹\${customer.annual_income.toLocaleString()}L\` : '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Employed In</span><span className="cd-kv-val">{customer.employed_in || '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Education</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Degree</span><span className="cd-kv-val">{customer.education || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">College</span><span className="cd-kv-val">{customer.college || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 1 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Lifestyle &amp; Plans</span>
                      <button className="cd-edit-btn" id="cd-edit-lifestyle"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Habits</div>
                          <div className="cd-habits-list">
                            {customer.diet && <span className="cd-habit-chip"><span className="ms">restaurant</span>{customer.diet}</span>}
                            {customer.smoking === 'Never' && <span className="cd-habit-chip"><span className="ms">smoke_free</span>Non-Smoker</span>}
                            {customer.smoking && customer.smoking !== 'Never' && <span className="cd-habit-chip"><span className="ms">smoking_rooms</span>{customer.smoking}</span>}
                            {customer.drinking && <span className="cd-habit-chip"><span className="ms">liquor</span>{customer.drinking}</span>}
                            {customer.physical_activity && <span className="cd-habit-chip"><span className="ms">fitness_center</span>{customer.physical_activity}</span>}
                            {customer.languages && customer.languages.length > 0 && customer.languages.map(lang => (
                              <span key={lang} className="cd-habit-chip"><span className="ms">language</span>{lang}</span>
                            ))}
                          </div>
                          {customer.marriage_timeline && <>
                            <div className="cd-section-label" style={{ marginTop: 12 }}>Future Plans</div>
                            <p className="cd-future-plans">Marriage timeline: {customer.marriage_timeline}. {customer.want_kids && customer.want_kids !== 'No' ? \`Wants kids: \${customer.want_kids}.\` : 'Does not want kids.'} {customer.open_to_relocate ? 'Open to relocate.' : ''}</p>
                          </>}
                        </div>
                        <div>
                          <div className="cd-section-label">Personality &amp; Interests</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Personality</span><span className="cd-kv-val">{customer.personality_type || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Pets</span><span className="cd-kv-val">{customer.open_to_pets ? 'Open to pets' : 'Not open to pets'}</span></div>
                            <div className="cd-kv" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span className="cd-kv-key" style={{ marginBottom: 4 }}>Interests</span>
                              <div className="cd-habits-list">
                                {customer.interests && customer.interests.length > 0 ? customer.interests.map(interest => (
                                  <span key={interest} className="cd-tag">{interest}</span>
                                )) : <span className="cd-kv-val">—</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 2 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Partner Preferences</span>
                      <button className="cd-edit-btn" id="cd-edit-prefs"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Basic Criteria</div>
                          <div className="cd-pref-list">
                            {customer.pref_age_min && <div className="cd-pref-item"><span className="ms">check_circle</span>Age: {customer.pref_age_min}–{customer.pref_age_max}</div>}
                            {customer.pref_location && customer.pref_location.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Location: {customer.pref_location.join(', ')}</div>}
                            {customer.pref_education && customer.pref_education.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Education: {customer.pref_education.join(', ')}</div>}
                            {(customer.pref_income_min || customer.pref_income_max) && <div className="cd-pref-item"><span className="ms">check_circle</span>Income: {customer.pref_income_min ? \`₹\${customer.pref_income_min}L\` : 'Any'} – {customer.pref_income_max ? \`₹\${customer.pref_income_max}L\` : 'Any'}</div>}
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Background &amp; Lifestyle</div>
                          <div className="cd-pref-list">
                            {customer.pref_religion && customer.pref_religion.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Religion: {customer.pref_religion.join(', ')}</div>}
                            {customer.pref_caste && customer.pref_caste.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Caste: {customer.pref_caste.join(', ')}</div>}
                            {customer.pref_diet && customer.pref_diet.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Diet: {customer.pref_diet.join(', ')}</div>}
                            {customer.pref_family_type && customer.pref_family_type.length > 0 && <div className="cd-pref-item"><span className="ms">check_circle</span>Family: {customer.pref_family_type.join(', ')}</div>}
                            {customer.pref_manglik && <div className="cd-pref-item"><span className="ms">check_circle</span>Manglik: {customer.pref_manglik}</div>}
                          </div>
                        </div>
                      </div>
                      {customer.deal_breakers?.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <div className="cd-section-label">Deal Breakers</div>
                          <div className="cd-pref-list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {customer.deal_breakers.map((db, i) => (
                              <div key={i} className="cd-pref-item deal-breaker" style={{ margin: 0 }}><span className="ms breaker">cancel</span>{db}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 3 && (
                <>
                  <div className="cd-card">
                    <div className="cd-card-header">
                      <span className="cd-card-title">Family Details</span>
                      <button className="cd-edit-btn" id="cd-edit-family"><span className="ms">edit</span></button>
                    </div>
                    <div className="cd-card-body">
                      <div className="cd-card-cols">
                        <div>
                          <div className="cd-section-label">Background</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Religion</span><span className="cd-kv-val">{customer.religion || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Caste</span><span className="cd-kv-val">{customer.caste || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Sub Caste</span><span className="cd-kv-val">{customer.sub_caste || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Mother Tongue</span><span className="cd-kv-val">{customer.mother_tongue || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Manglik Status</span><span className="cd-kv-val">{customer.manglik_status || '—'}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="cd-section-label">Family Setup</div>
                          <div className="cd-kv-list">
                            <div className="cd-kv"><span className="cd-kv-key">Family Type</span><span className="cd-kv-val">{customer.family_type || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Values</span><span className="cd-kv-val"><span className="cd-tag">{customer.family_values || '—'}</span></span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Father's Occ.</span><span className="cd-kv-val">{customer.father_occupation || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Mother's Occ.</span><span className="cd-kv-val">{customer.mother_occupation || '—'}</span></div>
                            <div className="cd-kv"><span className="cd-kv-key">Siblings</span><span className="cd-kv-val">{customer.num_siblings ?? '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>\`

content = content.replace(targetContent, replacement)

// 3. Move "Sent Matches History" to cd-right
const rightTargetContent = \`              <div className="cd-ai-card" id="cd-ai-card">
                <div className="cd-ai-inner">
                  <span className="ms">auto_awesome</span>
                  <div className="cd-ai-title">Find Matches</div>
                  <div className="cd-ai-sub">Discover premium profiles for {customer.first_name}</div>
                  <button
                    className="cd-ai-btn"
                    id="cd-start-matching-btn"
                    onClick={() => navigate(\`/customers/\${id}/matches\`)}
                  >
                    Start Matching Now
                  </button>
                </div>
              </div>\`

const rightReplacement = \`              <div className="cd-ai-card" id="cd-ai-card">
                <div className="cd-ai-inner">
                  <span className="ms">auto_awesome</span>
                  <div className="cd-ai-title">Find Matches</div>
                  <div className="cd-ai-sub">Discover premium profiles for {customer.first_name}</div>
                  <button
                    className="cd-ai-btn"
                    id="cd-start-matching-btn"
                    onClick={() => navigate(\`/customers/\${id}/matches\`)}
                  >
                    Start Matching Now
                  </button>
                </div>
              </div>

              {/* Sent Matches */}
              <div className="cd-timeline-card">
                <div className="cd-timeline-title">Sent Matches History</div>
                <div style={{ padding: '0 20px 20px' }}>
                  {sentMatch.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#777', padding: '8px 0' }}>No matches sent yet.</div>
                  ) : sentMatch.map(m => (
                    <div key={m.id} className="cd-match-card" style={{ marginBottom: 12 }}>
                      <DefaultAvatar className="cd-match-photo" style={{ borderRadius: '6px' }} />
                      <div className="cd-match-info">
                        <div className="cd-match-top">
                          <div>
                            <div className="cd-match-name">{m.first_name} {m.last_name}</div>
                            <div className="cd-match-loc">{m.city} • {m.occupation}</div>
                          </div>
                          <span className={\`cd-match-chip \${m.status === 'Interested' ? 'interested' : 'rejected'}\`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="cd-match-meta">
                          {m.annual_income && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Income</span><span className="cd-match-meta-val">₹{m.annual_income.toLocaleString()}L</span></div>}
                          {m.sent_at && <div className="cd-match-meta-item"><span className="cd-match-meta-label">Sent</span><span className="cd-match-meta-val">{fmtDate(m.sent_at)}</span></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>\`

content = content.replace(rightTargetContent, rightReplacement)

fs.writeFileSync('client/src/pages/CustomerDetailPage.jsx', content)
console.log('Fixed.')
