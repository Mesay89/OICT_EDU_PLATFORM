                  {formData.image && (
                    <div className="mt-2">
                      <img 
                        src={formData.image} 
                        alt="Bundle preview" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formData.courses.length < 2}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {editingBundle ? 'Update Bundle' : 'Create Bundle'}
              </button>
            </form>
          </div>
        )}

        {/* Bundles List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            My Bundles ({bundles.length})
          </h2>

          {bundles.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                You haven't created any bundles yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                Create course bundles to offer discounted packages to your students
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map(bundle => (
                <div
                  key={bundle._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {/* Bundle Image */}
                  <img
                    src={bundle.image || 'https://via.placeholder.com/400x300?text=Bundle'}
                    alt={bundle.title}
                    className="w-full h-48 object-cover"
                  />

                  {/* Bundle Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {bundle.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {bundle.description}
                    </p>

                    {/* Courses Included */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Includes {bundle.courses.length} courses:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {bundle.courses.slice(0, 3).map((course, idx) => (
                          <li key={idx} className="truncate">
                            • {course.title || 'Course'}
                          </li>
                        ))}
                        {bundle.courses.length > 3 && (
                          <li className="text-indigo-600">
                            + {bundle.courses.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Price and Status */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatPrice(bundle.price, false, 'ETB').formatted}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bundle.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                            : bundle.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {bundle.status ? bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1) : 'Pending'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bundle.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {bundle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Advanced Action Buttons */}
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => { setSelectedBundleForAction(bundle); setShowModuleForm(true); }}
                          className="w-full py-2.5 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-bold"
                        >
                          + Module
                        </button>
                        <button 
                           onClick={() => { setManagementBundle(bundle); setShowManagementView(true); setManagementTab('students'); }}
                           className="w-full py-2.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition font-bold flex items-center justify-center gap-2"
                         >
                           <Settings className="h-4 w-4" /> Manage
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <button 
                           onClick={() => { setSelectedBundleForAction(bundle); setShowCohortForm(true); }}
                           className="w-full py-2 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition font-semibold text-center"
                         >
                           + Cohort
                         </button>
                         <Link 
                          to={`/instructor/quiz-builder?bundleId=${bundle._id}`}
                          className="w-full py-2 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition font-semibold flex items-center justify-center text-center"
                        >
                          Quiz Builder
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link 
                          to={`/peer-review?bundleId=${bundle._id}`}
                          className="w-full py-2 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition font-semibold flex items-center justify-center text-center"
                        >
                          Peer Reviews
                        </Link>
                         <button 
                          onClick={() => handleEdit(bundle)}
                          className="w-full py-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 mt-2">
                        <button
                          onClick={() => handleDelete(bundle._id)}
                          className="w-full py-2 flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Bundle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModuleForm && selectedBundleForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Module: {selectedBundleForAction.title}</h2>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notice:</strong> New modules require Admin approval before they become visible to students.
              </p>
            </div>
            
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Module/Part Title</label>
                <input 
                  required 
                  value={modTitle} 
                  onChange={e=>setModTitle(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. Week 1: Introduction" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Video URL (Google Drive / YouTube / Upload)</label>
                <div className="flex gap-2">
                  <input 
                    value={modVideo} 
                    onChange={e=>setModVideo(e.target.value)} 
                    className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="video/*"
                    id="mod-video-file"
                    onChange={(e) => uploadFileHandler(e, setModVideo)}
                    className="hidden"
                  />
                  <label 
                    htmlFor="mod-video-file"
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Browse
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Document URL (Google Link / Upload)</label>
                <div className="flex gap-2">
                  <input 
                    value={modContent} 
                    onChange={e=>setModContent(e.target.value)} 
                    className="w-full bg-white text-gray-900 border border-gray-400 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://docs.google.com/..."
                  />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    id="mod-doc-file"
                    onChange={(e) => uploadFileHandler(e, setModContent)}
                    className="hidden"
                  />
                  <label 
                    htmlFor="mod-doc-file"
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Browse
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 mt-4 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowModuleForm(false); setSelectedBundleForAction(null); }} 
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCohortForm && selectedBundleForAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Establish Cohort: {selectedBundleForAction.title}</h2>
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Cohort Identifier</label>
                <input 
                  required 
                  value={cohortName} 
                  onChange={e=>setCohortName(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Enter unique cohort name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Launch Date</label>
                <input 
                  type="date" required value={cohortStartDate} onChange={e=>setCohortStartDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                <input 
                  type="date" required value={cohortEndDate} onChange={e=>setCohortEndDate(e.target.value)} 
                  className="w-full bg-white text-gray-900 border border-gray-400 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCohortForm(false); setSelectedBundleForAction(null); }} 
                  className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-400"
                >Cancel</button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >Launch Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManagementView && managementBundle && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-950/50">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="h-8 w-8 text-indigo-600" /> Manage: {managementBundle.title}
                  </h2>
               </div>
               <button onClick={() => setShowManagementView(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                 <Trash2 className="h-6 w-6 text-gray-400 hidden" />
                 Close
               </button>
            </div>

            <div className="flex px-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
               <button onClick={() => setManagementTab('cohorts')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'cohorts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <Users className="h-5 w-5" /> Cohort Strategy
               </button>
               <button onClick={() => setManagementTab('students')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <Users className="h-5 w-5" /> Student Roster
               </button>
               <button onClick={() => setManagementTab('coupons')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <BookOpen className="h-5 w-5" /> Course Pricing
               </button>
               <button onClick={() => setManagementTab('assignments')} className={`px-6 py-4 font-black transition-all flex items-center gap-2 border-b-4 ${managementTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                 <ClipboardList className="h-5 w-5" /> Assignments
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               {managementTab === 'cohorts' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30">
                       <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                         <Users className="h-5 w-5" /> Manage Batches / Cohorts
                       </h3>
                       {myCohorts.length === 0 ? (
                         <div className="text-center py-10"><p className="text-gray-500 font-bold">No cohorts created yet.</p></div>
                       ) : (
                         <div className="space-y-6">
                            {myCohorts.map(cohort => (
                              <div key={cohort._id} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                  <div>
                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{cohort.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium">{new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {managementTab === 'students' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Students ({studentsList.length})</h3>
                       
                       <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 mb-8">
                          <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Free Manual Enrollment
                          </h3>
                          <form onSubmit={handleManualEnroll} className="flex flex-col md:flex-row gap-4">
                             <input 
                                required 
                                type="email" 
                                placeholder="Student Email Address" 
                                value={searchEmail} 
                                onChange={(e) => setSearchEmail(e.target.value)} 
                                className="flex-1 p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white focus:border-indigo-500" 
                             />
                             <button type="submit" disabled={loadingAction} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 px-8 py-4 whitespace-nowrap">
                                Enroll for Free
                             </button>
                          </form>
                       </div>

                       {studentsList.length === 0 ? (
                         <div className="text-center py-20 bg-gray-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-xl">No students enrolled yet.</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentsList.map(item => (
                              <div key={item.user?._id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between group hover:border-indigo-500 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-100">
                                       <img src={item.user?.image || 'https://via.placeholder.com/150'} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                       <p className="font-black text-gray-900 dark:text-white">{item.user?.name}</p>
                                       <p className="text-xs text-gray-500">{item.user?.email}</p>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {managementTab === 'coupons' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30">
                       <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
                         <Plus className="h-5 w-5" /> Create Discount Coupon
                       </h3>
                       <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input required type="text" placeholder="CODE (e.g. SUMMER50)" value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                          <select value={couponForm.discountType} onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white">
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (ETB)</option>
                          </select>
                          <input required type="number" placeholder="Amount" value={couponForm.discountAmount} onChange={(e) => setCouponForm({...couponForm, discountAmount: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                          <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="date" required value={couponForm.expiryDate} onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <input type="number" required placeholder="Usage Limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <button type="submit" disabled={loadingAction} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 py-4">Generate Coupon</button>
                          </div>
                       </form>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Coupons</h3>
                       {couponsList.length === 0 ? (
                         <div className="text-center py-10 bg-gray-50 dark:bg-zinc-950 border-2 border-dashed rounded-3xl border-gray-200 dark:border-zinc-800">
                             <p className="text-gray-400 font-bold">No coupons created yet.</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {couponsList.map(c => (
                              <div key={c._id} className="p-6 bg-white dark:bg-zinc-950 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl flex items-center justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-2xl font-black text-emerald-600">{c.code}</span>
                                      <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-1 rounded font-black uppercase">ACTIVE</span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold font-mono">
                                      {c.discountAmount}{c.discountType === 'percentage' ? '%' : ' ETB'} OFF • Exp: {new Date(c.expiryDate).toLocaleDateString()}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{c.usedCount} / {c.usageLimit}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Redemptions</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}

                          {managementTab === 'assignments' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">

                   {/* ── Create / Edit Form ── */}
                   <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30">
                      <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5" /> {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                      </h3>
                      <form onSubmit={handleCreateAssignment} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required type="text" placeholder="Assignment Title" value={assignmentForm.title} onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                            <input required type="number" placeholder="Max Points" value={assignmentForm.points} onChange={(e) => setAssignmentForm({...assignmentForm, points: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />
                         </div>
                         <textarea required placeholder="Detailed instructions for students..." value={assignmentForm.description} onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})} className="w-full p-4 h-28 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white resize-none" />
                         <input type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} className="p-4 rounded-xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none font-bold text-gray-900 dark:text-white" />

                         {/* ── Question Builder ── */}
                         <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-4 space-y-4">
                           <div className="flex items-center justify-between">
                             <p className="font-black text-amber-800 dark:text-amber-300 text-sm uppercase tracking-widest">📝 Questions ({assignmentForm.questions.length})</p>
                             <div className="flex gap-2">
                               <button type="button" onClick={() => addQuestion('essay')} className="px-3 py-2 text-xs font-black bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">+ Essay</button>
                               <button type="button" onClick={() => addQuestion('choice')} className="px-3 py-2 text-xs font-black bg-green-100 text-green-700 rounded-lg hover:bg-green-200">+ Choice</button>
                               <button type="button" onClick={() => addQuestion('short_answer')} className="px-3 py-2 text-xs font-black bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">+ Short Answer</button>
                             </div>
                           </div>
                           {assignmentForm.questions.map((q, qi) => (
                             <div key={qi} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                               <div className="flex items-center justify-between">
                                 <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${q.type === 'essay' ? 'bg-blue-100 text-blue-700' : q.type === 'choice' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{q.type.replace('_',' ')}</span>
                                 <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500 hover:text-red-700 font-black text-xs">✕ Remove</button>
                               </div>
                               <input required placeholder={`Question ${qi + 1} prompt...`} value={q.prompt} onChange={e => updateQuestion(qi, 'prompt', e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 font-medium text-gray-900 dark:text-white outline-none" />
                               {q.type === 'choice' && (
                                 <div className="space-y-2">
                                   {(q.options || []).map((opt, oi) => (
                                     <div key={oi} className="flex items-center gap-2">
                                       <input type="radio" name={`correct-${qi}`} checked={q.correctOption === oi} onChange={() => updateQuestion(qi, 'correctOption', oi)} className="accent-green-500" title="Mark as correct" />
                                       <input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateChoiceOption(qi, oi, e.target.value)} className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 font-medium text-gray-900 dark:text-white outline-none text-sm" />
                                     </div>
                                   ))}
                                   <button type="button" onClick={() => setAssignmentForm(prev => { const qs=[...prev.questions]; qs[qi]={...qs[qi], options:[...qs[qi].options,'']}; return {...prev, questions:qs}; })} className="text-xs font-black text-green-600 hover:underline">+ Add option</button>
                                 </div>
                               )}
                             </div>
                           ))}
                           {assignmentForm.questions.length === 0 && (
                             <p className="text-center text-sm text-amber-600 font-bold py-2">No questions added yet. Use the buttons above to add questions.</p>
                           )}
                         </div>

                         <div className="flex gap-3">
                           {editingAssignment && (
                             <button type="button" onClick={() => { setEditingAssignment(null); setAssignmentForm({ title: '', description: '', points: 100, dueDate: '', questions: [] }); }} className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white rounded-xl font-black py-4">Cancel Edit</button>
                           )}
                           <button type="submit" disabled={loadingAction} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-lg shadow-amber-500/20 py-4">
                             {loadingAction ? '⏳ Saving...' : (editingAssignment ? '✏️ Update & Resend for Approval' : '🚀 Submit for Approval')}
                           </button>
                         </div>
                      </form>
                   </div>
                   
                   {/* ── Assignment List ── */}
                   <div className="space-y-4">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">Bundle Assignments</h3>
                      {assignmentsList.length === 0 ? (
                        <div className="text-center py-10"><p className="text-gray-400 font-bold">No assignments yet. Create one above.</p></div>
                      ) : (
                        <div className="space-y-4">
                           {assignmentsList.map(asn => (
                              <div key={asn._id} className="group bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-amber-500 transition-all">
                                 <div className="flex items-start justify-between mb-3">
                                    <div>
                                       <h4 className="font-black text-xl text-gray-900 dark:text-white">{asn.title}</h4>
                                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{asn.points} pts{asn.dueDate ? ` • Due ${new Date(asn.dueDate).toLocaleDateString()}` : ''}</p>
                                       <span className={`mt-2 inline-block text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${asn.status === 'approved' ? 'bg-green-100 text-green-700' : asn.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                         {asn.status === 'approved' ? '✅ Approved' : asn.status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                                       </span>