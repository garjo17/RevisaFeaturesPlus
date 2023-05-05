Ext.define('CustomApp', {
    extend: 'Rally.app.App',      
    componentCls: 'app',       


// Entry Point to App
launch: function() {

      console.log('App for Caixabank');    
      this.pulldownContainer = Ext.create('Ext.container.Container', {    
        id: 'pulldown-container-id',
        layout: {
                type: 'hbox',          
                align: 'stretch'
            }
      });

      this.add(this.pulldownContainer); 

     this._loadIterations();
    },

    // create iteration pulldown and load iterations
    _loadIterations: function() {
         

        this.allUserStories = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallycheckboxfield',
                fieldLabel: '  All User Stories:',
                name: 'mycheckbox',
                id: 'alluserstories',
                value: false,
                listeners: {
                    change: function() { 
                        this._makeStore();
                   },
                
                   
                   scope: this
                 }
            }],
            renderTo: Ext.getBody().dom
        });


        this.iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox', {
          fieldLabel: 'Iteration',
          labelAlign: 'right',
          width: 370,
          listeners: {
              ready: function() {             
                   this._makeStore();
             },
          select: function() {   
                   this._makeStore();
             },
             scope: this
           }
        });  
        
        this.pulldownContainer.add(this.iterComboBox);   
       
        this.pulldownContainer.add(this.allUserStories); 
      
        
     },

    // Get data from Rally

    _makeStore: function() {
        
        Ext.create('Rally.data.wsapi.Store', {
            model: 'PortfolioItem/Feature',
            fetch: ['FormattedID','Name','State','Parent', 'Project', 'Release','owner', 'Description',
                    'PercentDoneByStoryCount','PercentDoneByStoryPlanEstimate',
                   'AcceptedLeafStoryCount','ActualEndDate','ActualStartDate','PlannedStartDate','PlannedEndDate'],
            pageSize: 100,
            autoLoad: true,
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
        console.log('CAMBIA',this.allUserStories.items)  ;     
        console.log('CAMBIA',this.down('#alluserstories').getValue()) ;
    },

    _onDataLoaded: function(store, data){
        var features = [];
        var pendingstories = data.length;
        if (data.length ===0) {
                this._createGrid(features);  
        }
        //console.log(data); 
        _.each(data, function(feature) {
					var numStories = 0 ;	
                    var featureRelease = (feature.get('Release')) ? feature.get('Release')._refObjectName : "None";
                    var featureProject = feature.get('Project')._refObjectName;
                    var featureState = (feature.get('State')) ? feature.get('State')._refObjectName : "None" ;                   
					
                    var f  = {
                        FormattedID: feature.get('FormattedID'),
                        Name: feature.get('Name'),
                        _ref: feature.get("_ref"),
                        Release: featureRelease,
                        Project: featureProject,
                        State: featureState,
                        Iniciative: (feature.get('Parent') && feature.get('Parent')._refObjectName) || 'None',
                        Owner: (feature.get('Owner') && feature.get('Owner')._refObjectName) || 'None',
                        PercentDoneByStoryCount: feature.get('PercentDoneByStoryCount'),
                        PercentDoneByStoryPlanEstimate: feature.get('PercentDoneByStoryPlanEstimate'),
                        ActualStartDate: feature.get('ActualStartDate'),
                        PlannedStartDate: feature.get('PlannedStartDate'),
						PlannedEndDate: feature.get('PlannedEndDate'),
                        
                        UserStories: []
                    };
                    
                    var stories = feature.getCollection('UserStories', {fetch: ['FormattedID',
                                                                                'ScheduleState',
                                                                                'Owner',
                                                                                'Iteration',
                                                                                'State',
                                                                                'Release',
																				'Name'
                                                                              ]
                                                                        });
															
                    stories.load({
                        callback: function(records){
                                                     
                            _.each(records, function(story){
                                var storyIteration = (story.get('Iteration')) ? story.get('Iteration')._refObjectName : "None" ;
								var storyName = (story.get('Iteration')) ? story.get('Name') : "None" ;
                             
                                
                                var storyProject = story.get('Project')._refObjectName;
                              
                                
                                if ( storyIteration === this.iterComboBox.getRecord().get('Name')){
									//console.log('cuenta: ' , numStories);
									numStories = numStories + 1 ;
                                    f.UserStories.push({
                                    _ref: story.get('_ref'),
                                    FormattedID: story.get('FormattedID'),
                                    ScheduleState: story.get('ScheduleState'),
                                    Iteration: storyIteration ,
                                    Project: storyProject,
									Name: storyName,
                                    Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None'
                                    });
								//console.log('cuenta hsito: ' , numStories);
								
                                } else if ( this.down('#alluserstories').getValue())  {
                                    
                                    f.UserStories.push({
                                    _ref: story.get('_ref'),
                                    FormattedID: story.get('FormattedID'),
                                    ScheduleState: story.get('ScheduleState'),
                                    Iteration: storyIteration ,
                                    Project: storyProject,
									Name: storyName,
                                    Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None'
                                    });
							//	console.log('cuenta hsito: ' , numStories);

                                }
                            }, this);
							
                            if (numStories !== 0 ) {
										features.push(f);
								}
                            --pendingstories;
                            if (pendingstories === 0) {
                                this._createGrid(features);
                            }
                        },
                        scope: this
                    });
					
					console.log('numero historias: ' , numStories) ;
					
        }, this);
},

_createGrid: function(features) {
var featureStore = Ext.create('Rally.data.custom.Store', {
        data: features,
        pageSize: 100,
        remoteSort:false,
        groupField: 'Iniciative'
    });

if (!this.down('#fgrid')){
 
  this.add({
    xtype: 'rallygrid',
    itemId: 'fgrid',
    store: featureStore,
    features: [{ftype:'groupingsummary'}],
    
    columnCfgs: [
        {
           text: 'ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
            tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
        },
        
        {
            text: 'Name', dataIndex: 'Name'
        },
        
        {
          text: 'Project(team)', dataIndex: 'Project'
        },
        {
          text: 'Owner', dataIndex: 'Owner'
        },
        {
          xtype: 'templatecolumn',
          text: 'Planned Start Date',
          tpl: Ext.create('Rally.ui.renderer.template.DateTemplate', {fieldName: 'PlannedStartDate'})
        },
        {
          xtype: 'templatecolumn',
          text: 'Planned End Date',
          tpl: Ext.create('Rally.ui.renderer.template.DateTemplate', {fieldName: 'PlannedEndDate'})
        },
        {
          xtype: 'templatecolumn',
          text: '% Done by Story Count',
          dataIndex: 'PercentDoneByStoryCount',
          tpl: Ext.create('Rally.ui.renderer.template.progressbar.PercentDoneByStoryCountTemplate')
        },
        {
            xtype: 'templatecolumn',
            text: 'Progreso',
            dataIndex: '',
            tpl: Ext.create('Rally.ui.renderer.template.progressbar.TimeboxProgressBarTemplate',{fieldName: 'PercentDoneByStoryCount', 
                                                                                                PlannedStartDate:'PlannedStartDate,',
                                                                                                PlannedEndDate:'PlannedEndDate'})
        },
        {
          text: 'Feature Release', dataIndex: 'Release'

        },
        {
            text: 'User Stories', dataIndex: 'UserStories', flex: 1,
            renderer: function(value) {
                var html = [];
                _.each(value, function(userstory){
                    html.push('<b><a href="' + Rally.nav.Manager.getDetailUrl(userstory) +
                     '">' + userstory.FormattedID + 
                     '	</a></b>' + 
                     '<b>Name:</b>' + userstory.Name +
                     '<b> State: </b>' + userstory.ScheduleState +
                     '<b> Iteration: </b>' + userstory.Iteration);
                });
                return html.join('<br/>');
            }
        }
    ]
    
});
}
else{
    this.down('#fgrid').reconfigure(featureStore);
}
}

    

});