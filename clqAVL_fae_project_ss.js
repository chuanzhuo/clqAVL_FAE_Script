
/**
 * @projectDescription Availink: Server side relating to Project
 * 	Primary working for summary 'FAE Owner Group' to Customer's 'FAE Owner Groups'
 * @author COLOQI Limited
 * @since  2010.2
 * @version Created 20110714 Zeng, Chuan Zhuo
 */
 
/*
 * 'AVL Support Person' permission checking
 */
function clqAVLfae_project_BeforeLoadSS(type, form)
{
	var context = nlapiGetContext();
	//just trigger and block on user interface operation.
	if ((type.toLowerCase() == 'view' || 'edit' || 'xedit') && context.getExecutionContext == 'userinterface')
	{
		//check role first before permission checking.
		var curUser = nlapiGetUser();
		//var curRole = nlapiGetRole();	//solution: role internalId need to mapping to role name in configuration file.
		var curRoleName = context.getRoleId();
		if (curRoleName == 'AVL Support Person')
		{
			var faeOwnerGroupId = nlapiGetFieldValue('custentity_clqfae_ownergroup');
			if (Boolean(faeOwnerGroupId))
			{
				var faeOwnerIds = nlapiLookupField('customrecord_clqfae_group', faeOwnerGroupId, 'custrecord_clqfaegroup_employees');
				if (faeOwnerIds.indexOf(curUser) == -1){
					throw '[CLQ] Permission Violation: this customer, prospect or lead cannot be accessed by your group.';
				}
			}
		}
	}
	return true;
}

/*	
 * Search customer's projects to refresh on summary.
 * BeforeSubmit changed to AfterSubmit, do a search to summary.
 * Even trigger when custentity_clqfae_ownergroup has not value in Project Record.
 * Shoud 'Run as Admin' so can do a totally search for summary
 */
function clqAVLfae_project_AfterSubmitSS(type)
{ 
	if (type.toLowerCase() == 'create' || 'edit' || 'xedit')
	{
		var customerId = nlapiGetFieldValue('parent');
		//advance project should not including in this customisation
		if (!Boolean(customerId)) return true;
		//don't worry, prospect can also be including in such code.
		var origCustomerOwnerGroups_Str = nlapiLookupField('customer', customerId, 'custentity_clqfae_customerownergroups');
		
		var searchRes = nlapiSearchRecord('customer', null, 
											[new nlobjSearchFilter('internalid', null, 'anyof', customerId)], 
										  	[new nlobjSearchColumn('companyname'), 
										  	 new nlobjSearchColumn('custentity_clqfae_ownergroup', 'job')
										  	 ]);
		if (!Boolean(searchRes))
		{ 	//no result so values in any project, clean up customer owner groups
			nlapiSubmitField('customer', customerId, 'custentity_clqfae_customerownergroups', '');
			//return true;
		}else
		{
			//collection for totally related owner group
			var groupsArr = [];
			for (var i = 0; i < searchRes.length; i++ )
			{
				var tempGroup = searchRes[i].getValue('custentity_clqfae_ownergroup', 'job');
				//project1 ownergroup has value and value have not been collected.
				if (Boolean(tempGroup) && groupsArr.indexOf(tempGroup) == -1){
					groupsArr.push(tempGroup);
				}
			}
			//submit/refresh customer owner groups field, multi-select is not support by Xedit.
			//nlapiSubmitField('customer', customerId, 'custentity_clqfae_customerownergroups', groupsArr.join(String.fromCharCode(5)));
			var customerRec = nlapiLoadRecord('customer', customerId);
			customerRec.setFieldValues('custentity_clqfae_customerownergroups', groupsArr);
			//ignoreMandatoryFields = true.
			try{
				var id = nlapiSubmitRecord(customerRec, true, true);
			}catch(ex){
				var detailMsg=ex;
				if (ex instanceof nlobjError){
					detailMsg = ex.getDetails();
				}
				throw '[ERR] Fail to sychronize "Project Owner Group" to customer, Error message: ' + detailMsg + '\rPlease try redit project record.';
			}
		}
	}
	return true;
}


